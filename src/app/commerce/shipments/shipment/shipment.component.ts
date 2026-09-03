import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesRestApi } from '../../../../lib/abtract/ViesRestApi';
import { RouteUtils } from '../../../../lib/util/Route.utils';
import { MatOption } from '../../../../lib/model/mat.model';
import { ViesDateTime } from '../../../../lib/model/vies.model';
import { APP_ROUTES } from '../../../app.routes';
import { OrderFulfillment, Shipment } from '../../../shared/model/commerce.model';
import { ShipmentService } from '../../../shared/service/shipment/shipment.service';
import { OrderFulfillmentService } from '../../../shared/service/order-fulfillment/order-fulfillment.service';

// Shipment editor at /commerce/shipments/{new,:id}.
//
// Quirks handled here (per the backend contract):
//   • `trackingNumber` is DB-unique → 409 surfaces through the error dialog.
//   • `estimatedDeliveryDate` and `actualDeliveryDate` are BOTH non-nullable —
//     they default to "now" on the blank object and the pickers below let the
//     admin adjust. Never sent as null.
//   • `orderFulfillment` links the shipment to an order. On create the admin
//     picks from an autocomplete over order numbers (or arrives pre-linked via
//     `?orderId=` from the order detail's "Create shipment" button). On edit
//     the link is read-only — re-parenting a shipment is not a real workflow.
@Component({
  selector: 'app-shipment',
  templateUrl: './shipment.component.html',
  styleUrls: ['./shipment.component.scss'],
  imports: [NgComponentModule]
})
export class ShipmentComponent extends ViesRestApi<Shipment, ShipmentService> implements OnInit {

  service = inject(ShipmentService);
  orderService = inject(OrderFulfillmentService);
  activatedRoute = inject(ActivatedRoute);

  validForm = signal<boolean>(false);

  // Global pool of orders for the link picker (create mode only).
  allOrders = signal<OrderFulfillment[]>([]);

  orderOptions = computed<MatOption<OrderFulfillment>[]>(() =>
    this.allOrders().map(o => ({
      value: o,
      valueLabel: `${o.orderNumber || '(no number)'} — ${o.totalAmount} ${o.currency}`
    }))
  );

  selectedOrder = computed<OrderFulfillment | null>(() => {
    const oid = this.value()?.orderFulfillment?.id;
    if (!oid) return null;
    return this.allOrders().find(o => o.id === oid)
        ?? (this.value()?.orderFulfillment as OrderFulfillment)
        ?? null;
  });

  override getRouteId() {
    const id = RouteUtils.getPathVariable('shipments');
    return id === 'new' ? null : id;
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.refreshOrders();

    // Pre-link when arriving from an order detail's "Create shipment" button.
    const orderId = this.activatedRoute.snapshot.queryParamMap.get('orderId');
    if (orderId && !this.id()) {
      const v = this.value();
      if (v) {
        v.orderFulfillment = { id: orderId } as OrderFulfillment;
        this.value.set({ ...v });
      }
    }

    // The blank Shipment's dates are all-zero ViesDateTimes — truthy, so the
    // `??` defaults in onMainFormChange never fire and an untouched form would
    // persist a 0-0-0 window (same dead-?? bug as the Discount editor, FE-2).
    // Seed real dates for the create case: estimated = now + 5 days, actual =
    // now (both are non-nullable server-side; the form hint documents the
    // "actual = placeholder until delivered" convention). _value.set so the
    // seeded dates are the tracking baseline and Save stays disabled.
    if (!this.getRouteId()) {
      const v = this.value();
      if (v) {
        if (!v.estimatedDeliveryDate?.year) {
          const inFiveDays = new Date();
          inFiveDays.setDate(inFiveDays.getDate() + 5);
          v.estimatedDeliveryDate = ViesDateTime.fromJsDate(inFiveDays);
        }
        if (!v.actualDeliveryDate?.year) {
          v.actualDeliveryDate = ViesDateTime.now();
        }
        this._value.set({ ...v });
      }
    }
  }

  // After a create, leave /new for the entity's real edit URL so
  // refresh/bookmark/back work (FE-12).
  protected override afterSave(res: Shipment, wasCreate: boolean): void {
    if (wasCreate && res.id) {
      this.router.navigate([APP_ROUTES.commerceShipment(res.id)]);
    }
  }

  private refreshOrders() {
    this.orderService.getAll().subscribe({
      next: res => this.allOrders.set(res),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  // ---- Form handlers ---------------------------------------------------------

  // Preserve fields the dynamic form doesn't render (order link + both dates).
  onMainFormChange(v: Shipment) {
    const current = this.value();
    v.orderFulfillment = current?.orderFulfillment ?? new OrderFulfillment();
    v.estimatedDeliveryDate = current?.estimatedDeliveryDate ?? ViesDateTime.now();
    v.actualDeliveryDate = current?.actualDeliveryDate ?? ViesDateTime.now();
    this.value.set({ ...v });
  }

  onOrderChange(order: OrderFulfillment | null) {
    const v = this.value();
    if (!v) return;
    v.orderFulfillment = order ?? new OrderFulfillment();
    this.value.set({ ...v });
  }

  onEstimatedDateChange(dt: ViesDateTime) {
    const v = this.value();
    if (!v) return;
    v.estimatedDeliveryDate = dt;
    this.value.set({ ...v });
  }

  onActualDateChange(dt: ViesDateTime) {
    const v = this.value();
    if (!v) return;
    v.actualDeliveryDate = dt;
    this.value.set({ ...v });
  }

  hasOrderLink = computed<boolean>(() => !!this.value()?.orderFulfillment?.id);

  goToLinkedOrder() {
    const oid = this.value()?.orderFulfillment?.id;
    if (oid) this.router.navigate([APP_ROUTES.commerceOrder(oid)]);
  }

  backToList() {
    this.router.navigate([APP_ROUTES.commerceShipmentList]);
  }

  // ---- Save / delete ---------------------------------------------------------

  // Reduce the order back-ref to a bare {id} so the wire payload doesn't drag
  // the entire order graph (items, addresses, metadata) along — the backend
  // only needs the FK. Both dates are guaranteed non-null (blank defaults).
  override save() {
    const v = this._value.value();
    if (!v) return;
    if (!v.orderFulfillment?.id) {
      this.dialogUtils.openErrorMessage(
        'Order link required',
        'Pick the order this shipment belongs to before saving.'
      );
      return;
    }
    v.orderFulfillment = { id: v.orderFulfillment.id } as OrderFulfillment;
    super.save();
  }

  override async remove() {
    if (!this.id()) return;
    const confirmed = await this.dialogUtils.openCascadeDeleteConfirm('shipment');
    if (!confirmed) return;
    this.service.delete(this.id()).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: () => this.backToList(),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
}
