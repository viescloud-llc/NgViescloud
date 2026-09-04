import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesRestApi } from '../../../../lib/abtract/ViesRestApi';
import { RouteUtils } from '../../../../lib/util/Route.utils';
import { APP_ROUTES } from '../../../app.routes';
import { Address } from '../../../shared/model/address.model';
import {
  FulfillmentStatus,
  OrderFulfillment,
  OrderFulfillmentItem
} from '../../../shared/model/commerce.model';
import { OrderFulfillmentService } from '../../../shared/service/order-fulfillment/order-fulfillment.service';
import { CheckoutOrderService, CheckoutOrderView } from '../../../shared/service/checkout-order/checkout-order.service';
import { OrderRestockService } from '../../../shared/service/order-restock/order-restock.service';
import { SnackBarUtils } from '../../../../lib/util/SnackBar.utils';
import { firstValueFrom } from 'rxjs';

// Order metadata is a flat `Record<string,string>` bag. System keys are
// server-written history — every prefix here is treated as read-only audit
// data. Manager notes go under `notes.*` by convention (§ 5.11) and are the
// only editable slice.
const SYSTEM_METADATA_PREFIXES = ['checkout.', 'discount.', 'tax.', 'shipping.', 'restock.'];
const NOTES_METADATA_PREFIX = 'notes.';

// Legal FulfillmentStatus transitions. Terminal states (CANCELLED, REFUNDED,
// FAILED) have no outbound edges. The backend doesn't enforce this today, so
// the UI gates it — see the "Advance workflow" buttons on the Basics tab.
const STATUS_TRANSITIONS: Record<FulfillmentStatus, FulfillmentStatus[]> = {
  [FulfillmentStatus.PENDING]:            [FulfillmentStatus.PROCESSING, FulfillmentStatus.CANCELLED, FulfillmentStatus.FAILED],
  [FulfillmentStatus.PROCESSING]:         [FulfillmentStatus.SHIPPED,    FulfillmentStatus.CANCELLED, FulfillmentStatus.FAILED],
  [FulfillmentStatus.SHIPPED]:            [FulfillmentStatus.DELIVERED,  FulfillmentStatus.RETURNED],
  [FulfillmentStatus.DELIVERED]:          [FulfillmentStatus.RETURNED],
  [FulfillmentStatus.RETURNED]:           [FulfillmentStatus.REFUNDED,   FulfillmentStatus.PARTIALLY_REFUNDED],
  [FulfillmentStatus.PARTIALLY_REFUNDED]: [FulfillmentStatus.REFUNDED],
  [FulfillmentStatus.CANCELLED]:          [],
  [FulfillmentStatus.REFUNDED]:           [],
  [FulfillmentStatus.FAILED]:             []
};

// OrderFulfillment editor. Detail-only — orders come from checkout, not from
// the admin. Everything server-managed (orderNumber, userId, checkoutOrderId,
// currency, subtotal/tax/shipping/discount/total, addresses, system metadata)
// renders read-only. Editable: status (via transition buttons), notes, and
// notes.* metadata entries.
//
// Layout: mat-tab-group (Basics / Items / Addresses / Metadata) with the
// standard Save / Revert action row at the bottom.
@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss'],
  imports: [NgComponentModule]
})
export class OrderComponent extends ViesRestApi<OrderFulfillment, OrderFulfillmentService> implements OnInit {

  service = inject(OrderFulfillmentService);
  checkoutOrderService = inject(CheckoutOrderService);

  validForm = signal<boolean>(false);

  // Blank templates for the mat-table (items) and read-only address forms.
  readonly blankOrderItem = new OrderFulfillmentItem();
  readonly blankAddress = new Address();

  // ---- Payment side (library checkout module) -------------------------------
  //
  // OrderFulfillment.checkoutOrderId points at the LIBRARY checkout module's
  // CheckoutOrder. Fetched lazily when the admin opens the Payment tab (or
  // clicks refresh) — not on init, since it's a cross-service call that most
  // quick edits never need.
  paymentInfo = signal<CheckoutOrderView | null>(null);
  paymentLoadState = signal<'idle' | 'loading' | 'loaded' | 'failed'>('idle');

  loadPaymentInfo() {
    const checkoutOrderId = this.value()?.checkoutOrderId;
    if (!checkoutOrderId) return;
    this.paymentLoadState.set('loading');
    this.checkoutOrderService.get(checkoutOrderId).subscribe({
      next: res => {
        this.paymentInfo.set(res);
        this.paymentLoadState.set('loaded');
      },
      error: err => {
        this.paymentLoadState.set('failed');
        this.dialogUtils.openErrorMessageFromError(err);
      }
    });
  }

  // Flatten the payment record's scalar fields for a generic key/value table —
  // the checkout module's shape isn't mirrored here, so render everything the
  // server sends rather than only the fields we know about.
  paymentScalarEntries = computed<{ key: string; value: string }[]>(() => {
    const info = this.paymentInfo();
    if (!info) return [];
    return Object.entries(info)
      .filter(([, v]) => v !== null && v !== undefined && typeof v !== 'object')
      .map(([key, v]) => ({ key, value: String(v) }));
  });

  // The checkout order's purchased-item snapshot (CheckoutLineItem[]). Note:
  // per the OpenAPI there is NO transactions list on CheckoutOrder — refunds
  // and captures each return their own CheckoutTransaction, but they can't be
  // listed per-order, so the audit here is the line items + amount fields.
  paymentLineItems = computed<Record<string, unknown>[]>(() =>
    (this.paymentInfo()?.items ?? []) as Record<string, unknown>[]
  );

  lineItemEntries(item: Record<string, unknown>): { key: string; value: string }[] {
    return Object.entries(item)
      .filter(([, v]) => v !== null && v !== undefined && typeof v !== 'object')
      .map(([key, v]) => ({ key, value: String(v) }));
  }

  // ---- Shipment / return triggers -------------------------------------------

  createShipment() {
    const oid = this.id();
    if (!oid) return;
    this.router.navigate([APP_ROUTES.commerceShipmentNew], { queryParams: { orderId: oid } });
  }

  // ---- Restock after refund / return ---------------------------------------
  //
  // Puts refunded goods back on the shelf through the stock ledger
  // (POST /orders/{id}/restock → one RETURN movement per item). The server
  // tracks progress in metadata `restock.<itemId>` and refuses to exceed what
  // was sold, so this panel only ever offers the outstanding remainder.
  // Requires the refund status to be SAVED first (the server checks the
  // persisted status) and stock to have actually left (checkout captured).

  private readonly restockService = inject(OrderRestockService);
  private static readonly RESTOCKABLE: FulfillmentStatus[] = [
    FulfillmentStatus.REFUNDED, FulfillmentStatus.PARTIALLY_REFUNDED,
    FulfillmentStatus.RETURNED, FulfillmentStatus.CANCELLED
  ];

  // Per-item quantity overrides (default = outstanding remainder).
  restockOverrides = signal<Record<string, number>>({});
  restocking = signal<boolean>(false);

  isRestockableStatus = computed<boolean>(() => {
    const s = this.value()?.status;
    return !!s && OrderComponent.RESTOCKABLE.includes(s);
  });

  stockLeftForOrder = computed<boolean>(() =>
    this.value()?.metadata?.['checkout.stockDecremented'] === 'true'
  );

  restockRows = computed(() => {
    const v = this.value();
    const meta = v?.metadata ?? {};
    return (v?.items ?? []).map(item => {
      const sold = Number(item.quantity ?? 0);
      const restocked = Number(meta[`restock.${item.id}`] ?? 0);
      const remaining = Math.max(0, sold - restocked);
      const override = this.restockOverrides()[item.id];
      const qty = override === undefined ? remaining : Math.min(Math.max(0, override), remaining);
      return { item, sold, restocked, remaining, qty };
    });
  });

  restockTotal = computed<number>(() => this.restockRows().reduce((sum, r) => sum + r.qty, 0));

  canRestock = computed<boolean>(() =>
    this.isRestockableStatus() && this.stockLeftForOrder()
    && !this._value.isValueChange() && !this.restocking() && this.restockTotal() > 0
  );

  onRestockQtyChange(itemId: string, v: number | string) {
    this.restockOverrides.set({ ...this.restockOverrides(), [itemId]: Number(v) || 0 });
  }

  async restock() {
    const v = this.value();
    if (!v?.id || !this.canRestock()) return;
    const items = this.restockRows().filter(r => r.qty > 0)
      .map(r => ({ orderFulfillmentItemId: r.item.id, quantity: r.qty }));
    const confirmed = await this.dialogUtils.openConfirmDialog(
      'Restock items?',
      `Add ${this.restockTotal()} unit(s) across ${items.length} item(s) back into stock for order ${v.orderNumber}. This writes RETURN stock movements and cannot be undone here.`,
      'Restock', 'Cancel'
    ).catch(() => false);
    if (!confirmed) return;

    this.restocking.set(true);
    try {
      const updated = await firstValueFrom(
        this.restockService.restock(v.id, { items, reason: `Restock after ${v.status}` })
          .pipe(this.rxjsUtils.waitLoadingDialog())
      );
      this._value.set(updated);
      this.restockOverrides.set({});
      SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar,
        `Restocked ${items.reduce((s, i) => s + i.quantity, 0)} unit(s) for ${v.orderNumber}`, 'Dismiss', 6000);
    } catch (err) {
      this.dialogUtils.openErrorMessageFromError(err);
    } finally {
      this.restocking.set(false);
    }
  }

  createReturn() {
    const oid = this.id();
    if (!oid) return;
    this.router.navigate([APP_ROUTES.commerceReturnNew], { queryParams: { orderId: oid } });
  }

  // ---- Status transitions --------------------------------------------------

  availableTransitions = computed<FulfillmentStatus[]>(() => {
    const s = this.value()?.status;
    if (!s) return [];
    return STATUS_TRANSITIONS[s] ?? [];
  });

  // Cosmetic label for a transition button ("→ Processing", "→ Delivered").
  transitionLabel(t: FulfillmentStatus): string {
    return t.charAt(0) + t.slice(1).toLowerCase().replace(/_/g, ' ');
  }

  // Click handler for a "→ NEW_STATUS" button on the Basics tab. Does NOT
  // save — just stamps the new status onto _value. The parent Save button
  // commits via PUT.
  advanceStatus(next: FulfillmentStatus) {
    const v = this.value();
    if (!v) return;
    v.status = next;
    this.value.set({ ...v });
  }

  // ---- Metadata partitioning ----------------------------------------------
  //
  // The bag is a flat map. We split by prefix so the template can render two
  // distinct sections: a read-only audit panel for system keys and an editable
  // list for `notes.*`. Anything with an unrecognized prefix falls under
  // system (safer default — treat unknown as immutable history).

  systemMetadataEntries = computed<{ key: string; value: string }[]>(() =>
    this.entriesFor(k => SYSTEM_METADATA_PREFIXES.some(p => k.startsWith(p)))
  );

  notesMetadataEntries = computed<{ key: string; value: string }[]>(() =>
    this.entriesFor(k => k.startsWith(NOTES_METADATA_PREFIX))
  );

  otherMetadataEntries = computed<{ key: string; value: string }[]>(() =>
    this.entriesFor(k =>
      !SYSTEM_METADATA_PREFIXES.some(p => k.startsWith(p))
      && !k.startsWith(NOTES_METADATA_PREFIX)
    )
  );

  private entriesFor(pred: (key: string) => boolean): { key: string; value: string }[] {
    const meta = this.value()?.metadata ?? {};
    return Object.keys(meta)
      .filter(pred)
      .sort()
      .map(k => ({ key: k, value: meta[k] }));
  }

  // Draft state for the "Add note" form. Kept as signals rather than a bound
  // object so an empty topic can be validated cheaply.
  newNoteTopic = signal<string>('');
  newNoteBody = signal<string>('');

  canAddNote = computed<boolean>(() =>
    this.newNoteTopic().trim().length > 0
    && this.newNoteBody().trim().length > 0
  );

  addNote() {
    const v = this.value();
    if (!v) return;
    const topic = this.newNoteTopic().trim();
    const body = this.newNoteBody().trim();
    if (!topic || !body) return;

    // Namespace under `notes.` so the split above keeps working. If the admin
    // types "shipping-delay", the actual key becomes "notes.shipping-delay".
    // If they hand-type a fully-qualified `notes.foo`, don't double-prefix.
    const key = topic.startsWith(NOTES_METADATA_PREFIX) ? topic : NOTES_METADATA_PREFIX + topic;
    v.metadata = { ...v.metadata, [key]: body };
    this.value.set({ ...v });
    this.newNoteTopic.set('');
    this.newNoteBody.set('');
  }

  updateNote(key: string, body: string) {
    const v = this.value();
    if (!v) return;
    v.metadata = { ...v.metadata, [key]: body };
    this.value.set({ ...v });
  }

  removeNote(key: string) {
    const v = this.value();
    if (!v?.metadata) return;
    const next = { ...v.metadata };
    delete next[key];
    v.metadata = next;
    this.value.set({ ...v });
  }

  // Strip `notes.` prefix for display; keep the raw key for update/remove.
  notesTopicDisplay(key: string): string {
    return key.startsWith(NOTES_METADATA_PREFIX) ? key.slice(NOTES_METADATA_PREFIX.length) : key;
  }

  // ---- Basics change handler ----------------------------------------------

  // Dynamic form mutates in place; spread to fire the signal. Preserve hidden
  // collections (items, addresses, metadata) which the form doesn't render.
  onMainFormChange(v: OrderFulfillment) {
    const current = this.value();
    v.items = current?.items ?? [];
    v.shippingAddress = current?.shippingAddress ?? new Address();
    v.billingAddress = current?.billingAddress ?? new Address();
    v.metadata = current?.metadata ?? {};
    this.value.set({ ...v });
  }

  // ---- Lifecycle / navigation ---------------------------------------------

  override getRouteId() {
    // Only entered via `/commerce/orders/:orderId` — no /new flow.
    return RouteUtils.getPathVariable('orders');
  }

  backToList() {
    this.router.navigate([APP_ROUTES.commerceOrderList]);
  }

  // Cascade-delete confirm with item count. Admins deleting an order should
  // realize the fulfillment items go with it.
  override async remove() {
    if (!this.id()) return;
    const v = this.value();
    const confirmed = await this.dialogUtils.openCascadeDeleteConfirm('order', [
      { label: 'item', count: v?.items?.length ?? 0 }
    ]);
    if (!confirmed) return;
    this.service.delete(this.id()).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: () => this.backToList(),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
}
