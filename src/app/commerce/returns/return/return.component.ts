import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesRestApi } from '../../../../lib/abtract/ViesRestApi';
import { RouteUtils } from '../../../../lib/util/Route.utils';
import { MatOption } from '../../../../lib/model/mat.model';
import { APP_ROUTES } from '../../../app.routes';
import {
  FulfillmentStatus,
  OrderFulfillment,
  OrderFulfillmentItem,
  ReturnRequest,
  ReturnStatus
} from '../../../shared/model/commerce.model';
import { ReturnRequestService } from '../../../shared/service/return-request/return-request.service';
import { OrderFulfillmentService } from '../../../shared/service/order-fulfillment/order-fulfillment.service';
import { CheckoutOrderService } from '../../../shared/service/checkout-order/checkout-order.service';
import { OrderPaymentService } from '../../../shared/service/order-payment/order-payment.service';

// Legal ReturnStatus transitions. The backend does NOT enforce these (contract
// § ReturnRequest quirk), so the UI is the guard. Terminal states (REJECTED,
// REFUNDED, REPLACED, CANCELLED) have no outbound edges.
const RETURN_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  [ReturnStatus.REQUESTED]:  [ReturnStatus.APPROVED, ReturnStatus.REJECTED, ReturnStatus.CANCELLED],
  [ReturnStatus.APPROVED]:   [ReturnStatus.SHIPPED, ReturnStatus.CANCELLED],
  [ReturnStatus.SHIPPED]:    [ReturnStatus.RECEIVED],
  [ReturnStatus.RECEIVED]:   [ReturnStatus.INSPECTING, ReturnStatus.REFUNDED, ReturnStatus.REPLACED],
  [ReturnStatus.INSPECTING]: [ReturnStatus.REFUNDED, ReturnStatus.REPLACED, ReturnStatus.REJECTED],
  [ReturnStatus.REJECTED]:   [],
  [ReturnStatus.REFUNDED]:   [],
  [ReturnStatus.REPLACED]:   [],
  [ReturnStatus.CANCELLED]:  []
};

// Stages where issuing the refund makes sense (approved and goods on the way
// back, received, or under inspection).
const REFUNDABLE_STATUSES: ReturnStatus[] = [
  ReturnStatus.APPROVED, ReturnStatus.RECEIVED, ReturnStatus.INSPECTING
];

// ReturnRequest (RMA) editor at /commerce/returns/{new,:id}.
//
// Refund flow (intent § 5.5): on a refundable status, "Issue PayPal refund"
// calls the LIBRARY checkout module's refund endpoint with the return's
// `refundAmount`, then flips the parent OrderFulfillment.status to REFUNDED
// (full) or PARTIALLY_REFUNDED (partial vs order total), then stamps this
// return REFUNDED and saves. Each money-moving step is confirmed first.
@Component({
  selector: 'app-return',
  templateUrl: './return.component.html',
  styleUrls: ['./return.component.scss'],
  imports: [NgComponentModule]
})
export class ReturnComponent extends ViesRestApi<ReturnRequest, ReturnRequestService> implements OnInit {

  service = inject(ReturnRequestService);
  orderService = inject(OrderFulfillmentService);
  checkoutOrderService = inject(CheckoutOrderService);
  activatedRoute = inject(ActivatedRoute);

  validForm = signal<boolean>(false);
  readonly ReturnStatus = ReturnStatus;

  allOrders = signal<OrderFulfillment[]>([]);

  orderOptions = computed<MatOption<OrderFulfillment>[]>(() =>
    this.allOrders().map(o => ({
      value: o,
      valueLabel: `${o.orderNumber || '(no number)'} — ${o.totalAmount} ${o.currency}`
    }))
  );

  // Resolve the linked order from the pool (fresh, has items + checkoutOrderId)
  // falling back to whatever's embedded on the return.
  linkedOrder = computed<OrderFulfillment | null>(() => {
    const oid = this.value()?.orderFulfillment?.id;
    if (!oid) return null;
    return this.allOrders().find(o => o.id === oid)
        ?? (this.value()?.orderFulfillment as OrderFulfillment)
        ?? null;
  });

  // Item picker options — only the linked order's line items qualify.
  itemOptions = computed<MatOption<OrderFulfillmentItem>[]>(() => {
    const order = this.linkedOrder();
    return (order?.items ?? []).map(i => ({
      value: i,
      valueLabel: `${i.lineItemSku || i.id} — qty ${i.quantity} @ ${i.unitPrice}`
    }));
  });

  selectedItem = computed<OrderFulfillmentItem | null>(() => {
    const iid = this.value()?.orderFulfillmentItem?.id;
    if (!iid) return null;
    return (this.linkedOrder()?.items ?? []).find(i => i.id === iid)
        ?? (this.value()?.orderFulfillmentItem as OrderFulfillmentItem)
        ?? null;
  });

  availableTransitions = computed<ReturnStatus[]>(() => {
    const s = this.value()?.status;
    if (!s) return [];
    return RETURN_TRANSITIONS[s] ?? [];
  });

  canRefund = computed<boolean>(() => {
    const v = this.value();
    if (!v || !this.id()) return false;
    if (!REFUNDABLE_STATUSES.includes(v.status)) return false;
    return !!this.linkedOrder()?.checkoutOrderId;
  });

  override getRouteId() {
    const id = RouteUtils.getPathVariable('returns');
    return id === 'new' ? null : id;
  }

  // After a create, leave /new for the entity's real edit URL so
  // refresh/bookmark/back work (FE-12).
  protected override afterSave(res: ReturnRequest, wasCreate: boolean): void {
    if (wasCreate && res.id) {
      this.router.navigate([APP_ROUTES.commerceReturn(res.id)]);
    }
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.refreshOrders();

    const orderId = this.activatedRoute.snapshot.queryParamMap.get('orderId');
    if (orderId && !this.id()) {
      const v = this.value();
      if (v) {
        v.orderFulfillment = { id: orderId } as OrderFulfillment;
        this.value.set({ ...v });
      }
    }
  }

  private refreshOrders() {
    this.orderService.getAll().subscribe({
      next: res => this.allOrders.set(res),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  // ---- Form handlers ---------------------------------------------------------

  onMainFormChange(v: ReturnRequest) {
    const current = this.value();
    v.orderFulfillment = current?.orderFulfillment ?? new OrderFulfillment();
    v.orderFulfillmentItem = current?.orderFulfillmentItem ?? new OrderFulfillmentItem();
    this.value.set({ ...v });
  }

  onOrderChange(order: OrderFulfillment | null) {
    const v = this.value();
    if (!v) return;
    v.orderFulfillment = order ?? new OrderFulfillment();
    // Order changed → the previously-picked item no longer belongs.
    v.orderFulfillmentItem = new OrderFulfillmentItem();
    this.value.set({ ...v });
  }

  onItemChange(item: OrderFulfillmentItem | null) {
    const v = this.value();
    if (!v) return;
    v.orderFulfillmentItem = item ?? new OrderFulfillmentItem();
    this.value.set({ ...v });
  }

  transitionLabel(t: ReturnStatus): string {
    return t.charAt(0) + t.slice(1).toLowerCase().replace(/_/g, ' ');
  }

  advanceStatus(next: ReturnStatus) {
    const v = this.value();
    if (!v) return;
    v.status = next;
    this.value.set({ ...v });
  }

  goToLinkedOrder() {
    const oid = this.value()?.orderFulfillment?.id;
    if (oid) this.router.navigate([APP_ROUTES.commerceOrder(oid)]);
  }

  backToList() {
    this.router.navigate([APP_ROUTES.commerceReturnList]);
  }

  // ---- Refund flow -----------------------------------------------------------

  // Money moves here — in ONE server-side step (POST /returns/{id}/refund,
  // checkout:refund): the server takes the amount from this return (refundAmount
  // + shipping when refundShipping; 0 = everything still refundable), refunds
  // through the checkout module, lets the webhook listener move the order
  // status, closes this return as REFUNDED and notes the transaction.
  private readonly orderPaymentService = inject(OrderPaymentService);

  // What the returned units are worth (the server computes the same default on
  // create and refunds it when the amount is empty, BE-24): shown so the admin
  // sees a number, never "everything" (FE-25).
  returnValueText = computed<string>(() => {
    const v = this.value(); const item = this.selectedItem();
    const amount = v?.refundAmount && Number(v.refundAmount) > 0 ? Number(v.refundAmount).toFixed(2) : '';
    const sku = item?.lineItemSku || item?.productVariant?.sku || '';
    const qty = v?.returnQuantity || item?.quantity || 1;
    return amount ? `${amount} for ${qty}× ${sku}` : `the value of ${qty}× ${sku}`;
  });

  async issueRefund(wholeOrder = false) {
    const v = this._value.value();
    const order = this.linkedOrder();
    if (!v?.id || !order?.checkoutOrderId) return;
    if (this._value.isValueChange()) {
      this.dialogUtils.openErrorMessage('Save first', 'Save the return before issuing the refund — the server refunds the saved amount.');
      return;
    }
    const shipping = !wholeOrder && v.refundShipping && Number(order.shippingCost) > 0 ? ` plus shipping ${Number(order.shippingCost).toFixed(2)}` : '';
    const confirmed = await this.dialogUtils.openConfirmDialog(
      wholeOrder ? 'Refund the whole remaining balance?' : 'Issue refund?',
      wholeOrder
        ? `Refund EVERYTHING still refundable on order ${order.orderNumber} — not just this return's items — to the buyer. This cannot be undone.`
        : `Refund ${this.returnValueText()} ${order.currency}${shipping} to the buyer through the payment provider. This cannot be undone.`,
      wholeOrder ? 'Refund whole balance' : 'Refund', 'Cancel').catch(() => false);
    if (!confirmed) return;

    this.orderPaymentService.refundReturn(v.id, wholeOrder).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this._value.set(res.returnRequest);
        if (res.payment?.order) this.allOrders.set(this.allOrders().map(o => o.id === res.payment.order.id ? res.payment.order : o));
      },
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  // ---- Save / delete ---------------------------------------------------------

  // Reduce both back-refs to bare {id} so the payload doesn't carry the whole
  // order graph.
  override save() {
    const v = this._value.value();
    if (!v) return;
    if (!v.orderFulfillment?.id) {
      this.dialogUtils.openErrorMessage(
        'Order link required',
        'Pick the order this return belongs to before saving.'
      );
      return;
    }
    // Contract § 7.8: the line item is a REQUIRED FK — a return is always
    // against a specific order item.
    if (!v.orderFulfillmentItem?.id) {
      this.dialogUtils.openErrorMessage(
        'Order item required',
        'Pick which line item is being returned before saving.'
      );
      return;
    }
    v.orderFulfillment = { id: v.orderFulfillment.id } as OrderFulfillment;
    v.orderFulfillmentItem = { id: v.orderFulfillmentItem.id } as OrderFulfillmentItem;
    super.save();
  }

  override async remove() {
    if (!this.id()) return;
    const confirmed = await this.dialogUtils.openCascadeDeleteConfirm('return request');
    if (!confirmed) return;
    this.service.delete(this.id()).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: () => this.backToList(),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
}
