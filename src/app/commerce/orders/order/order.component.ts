import { HistoryPanelComponent } from '../../../shared/component/history-panel/history-panel.component';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesRestApi } from '../../../../lib/abtract/ViesRestApi';
import { RouteUtils } from '../../../../lib/util/Route.utils';
import { APP_ROUTES } from '../../../app.routes';
import { Address } from '../../../shared/model/address.model';
import {
  DigitalDownloadView,
  FulfillmentStatus,
  OrderFulfillment,
  OrderFulfillmentItem
} from '../../../shared/model/commerce.model';
import { DigitalDownloadService } from '../../../shared/service/digital-download/digital-download.service';
import { VariantFulfillmentType } from '../../../shared/model/product.model';
import { FileUtils } from '../../../../lib/util/File.utils';
import { AuthenticatorService } from '../../../../lib/service/authenticator.service';
import { OrderFulfillmentService } from '../../../shared/service/order-fulfillment/order-fulfillment.service';
import { CheckoutOrderService, CheckoutOrderView, CheckoutTransactionView } from '../../../shared/service/checkout-order/checkout-order.service';
import { OrderPaymentService, PaymentView } from '../../../shared/service/order-payment/order-payment.service';
import { ManualOrderService } from '../../../shared/service/manual-order/manual-order.service';
import { OFFLINE_PAYMENT_METHODS, PaymentMethod } from '../../../shared/model/manual-order.model';
import { ReceiptPrintUtil } from '../../../shared/util/receipt-print.util';
import { StoreSettingsService } from '../../../shared/service/store-settings/store-settings.service';
import { OrderRestockService } from '../../../shared/service/order-restock/order-restock.service';
import { SnackBarUtils } from '../../../../lib/util/SnackBar.utils';
import { firstValueFrom } from 'rxjs';

// Order metadata is a flat `Record<string,string>` bag. System keys are
// server-written history — every prefix here is treated as read-only audit
// data. Manager notes go under `notes.*` by convention (§ 5.11) and are the
// only editable slice.
const SYSTEM_METADATA_PREFIXES = ['checkout.', 'discount.', 'tax.', 'shipping.', 'restock.', 'digital.'];
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
  imports: [NgComponentModule, HistoryPanelComponent, MatSelectModule, MatFormFieldModule]
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

  // ---- Money actions (MONEY — each behind its own checkout:* authority) ----------
  //
  // The Payment tab loads the server-side PaymentView (lib checkout order +
  // transactions + what is refundable) and offers Refund / Capture / Cancel /
  // Sync. The server validates amounts, snapshots refund.* / cancel.* metadata,
  // and the webhook listener moves the order status — we just re-read.
  private readonly orderPaymentService = inject(OrderPaymentService);
  payment = signal<PaymentView | null>(null);
  transactions = computed<CheckoutTransactionView[]>(() => this.payment()?.transactions ?? []);
  refundAmount = signal<string>('');
  refundReason = signal<string>('');
  cancelReason = signal<string>('');
  moneyBusy = signal<boolean>(false);
  canRefundMoney = computed<boolean>(() => this.authenticatorService.hasAuthorityOrAdmin('checkout:refund'));
  canCaptureMoney = computed<boolean>(() => this.authenticatorService.hasAuthorityOrAdmin('checkout:capture'));
  canCancelMoney = computed<boolean>(() => this.authenticatorService.hasAuthorityOrAdmin('checkout:cancel'));
  canSyncMoney = computed<boolean>(() => this.authenticatorService.hasAuthorityOrAdmin('checkout:sync'));
  refundable = computed<number>(() => Number(this.payment()?.amountRefundable ?? 0));
  refundAmountValid = computed<boolean>(() => {
    const raw = this.refundAmount().trim();
    if (!raw) return this.refundable() > 0;               // empty = everything refundable
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 && n <= this.refundable() + 1e-9;
  });

  loadPaymentInfo() {
    const oid = this.getRouteId();
    if (!oid || !this.value()?.checkoutOrderId) return;
    this.paymentLoadState.set('loading');
    this.orderPaymentService.view(oid).subscribe({
      next: res => this.applyPayment(res, 'loaded'),
      error: err => {
        this.paymentLoadState.set('failed');
        this.dialogUtils.openErrorMessageFromError(err);
      }
    });
  }

  private applyPayment(res: PaymentView, state: 'loaded' = 'loaded') {
    this.payment.set(res);
    this.paymentInfo.set(res.checkoutOrder ?? null);
    this.paymentLoadState.set(state);
    // Money actions change the order (status, metadata) — reflect it unless a draft is open.
    if (res.order && !this._value.isValueChange()) this._value.set(res.order);
  }

  async refundMoney() {
    const oid = this.getRouteId();
    const p = this.payment();
    if (!oid || !p?.canRefund || !this.refundAmountValid()) return;
    const raw = this.refundAmount().trim();
    const amount = raw ? Number(raw).toFixed(2) : undefined;
    const currency = p.checkoutOrder?.currency ?? this.value()?.currency ?? '';
    const ok = await this.dialogUtils.openConfirmDialog(
      'Refund payment?',
      `Send ${amount ?? Number(p.amountRefundable).toFixed(2)} ${currency} back to the buyer through ${p.checkoutOrder?.provider ?? 'the payment provider'}. This moves real money and cannot be undone.`,
      'Refund', 'Cancel').catch(() => false);
    if (!ok) return;
    this.moneyBusy.set(true);
    this.orderPaymentService.refund(oid, amount, this.refundReason().trim()).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => { this.moneyBusy.set(false); this.refundAmount.set(''); this.refundReason.set(''); this.applyPayment(res); this.loadDownloads(); SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, 'Refund issued', 'Dismiss', 5000); },
      error: err => { this.moneyBusy.set(false); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  async captureMoney() {
    const oid = this.getRouteId();
    if (!oid || !this.payment()?.canCapture) return;
    const ok = await this.dialogUtils.openConfirmDialog('Capture payment?',
      'Charge the buyer\'s approved payment now, decrement stock and move the order to Processing.', 'Capture', 'Cancel').catch(() => false);
    if (!ok) return;
    this.moneyBusy.set(true);
    this.orderPaymentService.capture(oid).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => { this.moneyBusy.set(false); this.applyPayment(res); this.loadDownloads(); SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, 'Payment captured', 'Dismiss', 5000); },
      error: err => { this.moneyBusy.set(false); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  async cancelMoney() {
    const oid = this.getRouteId();
    if (!oid || !this.payment()?.canCancel) return;
    const ok = await this.dialogUtils.openConfirmDialog('Cancel this order?',
      'The unpaid order is voided at the provider and moves to Cancelled. Nothing is charged.', 'Cancel order', 'Keep').catch(() => false);
    if (!ok) return;
    this.moneyBusy.set(true);
    this.orderPaymentService.cancel(oid, this.cancelReason().trim()).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => { this.moneyBusy.set(false); this.cancelReason.set(''); this.applyPayment(res); SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, 'Order cancelled', 'Dismiss', 5000); },
      error: err => { this.moneyBusy.set(false); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  syncMoney() {
    const oid = this.getRouteId();
    if (!oid) return;
    this.moneyBusy.set(true);
    this.orderPaymentService.sync(oid).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => { this.moneyBusy.set(false); this.applyPayment(res); },
      error: err => { this.moneyBusy.set(false); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  // Manual (no checkout provider) orders: staff record the offline payment here.
  private readonly manualOrderService = inject(ManualOrderService);
  private readonly storeSettings = inject(StoreSettingsService);
  readonly offlineMethods = OFFLINE_PAYMENT_METHODS.filter(m => m.value !== 'UNPAID');
  recordMethod = signal<PaymentMethod>('CASH');
  recordReference = signal<string>('');
  recordTendered = signal<string>('');
  recordHandedOver = signal<boolean>(false);
  isManualOrder = computed<boolean>(() => !this.value()?.checkoutOrderId);

  async recordOfflinePayment() {
    const oid = this.getRouteId();
    if (!oid || !this.payment()?.canRecordPayment) return;
    const ok = await this.dialogUtils.openConfirmDialog('Record payment?',
      `Mark this order as paid by ${this.recordMethod()}. Stock moves and the buyer is notified, exactly like an online capture.`, 'Record', 'Cancel').catch(() => false);
    if (!ok) return;
    this.moneyBusy.set(true);
    this.manualOrderService.recordPayment(oid, { paymentMethod: this.recordMethod(), paymentReference: this.recordReference().trim() || undefined,
      amountTendered: this.recordTendered().trim() || undefined, handedOver: this.recordHandedOver() }).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: o => { this.moneyBusy.set(false); this._value.set(o); this.loadPaymentInfo(); this.loadDownloads(); SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, 'Payment recorded', 'Dismiss', 5000); },
      error: err => { this.moneyBusy.set(false); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  printReceipt() {
    const o = this.value();
    if (!o) return;
    try { ReceiptPrintUtil.print(o, this.storeSettings.current() ?? this.storeSettings.publicInfo()); } catch (err) { this.dialogUtils.openErrorMessageFromError(err); }
  }

  money(v?: string | number | null): string {
    return v === null || v === undefined || v === '' ? '—' : Number(v).toFixed(2);
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

  // ---- Customer link ------------------------------------------------------------
  private readonly authenticatorService = inject(AuthenticatorService);
  canViewCustomer = computed<boolean>(() => this.authenticatorService.hasAuthorityOrAdmin('customers:read'));

  openCustomer() {
    const uid = this.value()?.userId;
    if (uid) this.router.navigate([APP_ROUTES.commerceCustomer(uid)]);
  }

  // ---- Digital downloads ------------------------------------------------------
  //
  // Entitlements minted on payment capture for DIGITAL lines. Loaded on init
  // (by route id — the order itself may still be in flight); staff can grant
  // missing ones (file attached after the sale), revoke/restore, and pull a
  // file for support.
  private readonly digitalDownloadService = inject(DigitalDownloadService);
  downloads = signal<DigitalDownloadView[]>([]);
  downloadsLoaded = signal<boolean>(false);
  hasDigitalItems = computed<boolean>(() =>
    (this.value()?.items ?? []).some(i => i.productVariant?.fulfillmentType === VariantFulfillmentType.DIGITAL)
  );
  canGrantDownloads = computed<boolean>(() => {
    const s = this.value()?.status;
    return this.hasDigitalItems() && !!s
      && s !== FulfillmentStatus.PENDING && s !== FulfillmentStatus.CANCELLED
      && s !== FulfillmentStatus.FAILED && s !== FulfillmentStatus.REFUNDED;
  });

  override ngOnInit(): void {
    super.ngOnInit();
    this.loadDownloads();
  }

  loadDownloads() {
    const oid = this.getRouteId();
    if (!oid) return;
    this.digitalDownloadService.list(oid).subscribe({
      next: res => { this.downloads.set(res ?? []); this.downloadsLoaded.set(true); },
      error: () => { this.downloads.set([]); this.downloadsLoaded.set(true); }
    });
  }

  grantDownloads(notify: boolean) {
    const oid = this.getRouteId();
    if (!oid) return;
    this.digitalDownloadService.grant(oid, notify).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.downloads.set(res ?? []);
        SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, notify ? 'Downloads granted and buyer notified' : 'Downloads granted', 'Dismiss', 5000);
        this.refreshOrderSilently();
      },
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  async revokeDownload(d: DigitalDownloadView) {
    const oid = this.getRouteId();
    if (!oid) return;
    const ok = await this.dialogUtils.openConfirmDialog(
      'Revoke download access?',
      `The buyer will no longer be able to download ${d.variantName || d.variantSku || 'this item'}.`,
      'Revoke', 'Cancel').catch(() => false);
    if (!ok) return;
    this.digitalDownloadService.revoke(oid, d.entitlementId, 'Revoked by staff').subscribe({
      next: updated => this.downloads.set(this.downloads().map(x => x.entitlementId === updated.entitlementId ? updated : x)),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  restoreDownload(d: DigitalDownloadView) {
    const oid = this.getRouteId();
    if (!oid) return;
    this.digitalDownloadService.restore(oid, d.entitlementId).subscribe({
      next: updated => this.downloads.set(this.downloads().map(x => x.entitlementId === updated.entitlementId ? updated : x)),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  downloadAssetAsStaff(d: DigitalDownloadView, assetId: string, fileName: string) {
    const oid = this.getRouteId();
    if (!oid) return;
    this.digitalDownloadService.download(oid, d.entitlementId, assetId).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: blob => FileUtils.saveBlobAsFile(fileName || 'download', blob),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  // Grant may flip a digital-only order to DELIVERED server-side — re-read the
  // order without disturbing an unsaved draft.
  private refreshOrderSilently() {
    const oid = this.getRouteId();
    if (!oid || this._value.isValueChange()) return;
    this.service.get(oid).subscribe({ next: o => this._value.set(o), error: () => {} });
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
