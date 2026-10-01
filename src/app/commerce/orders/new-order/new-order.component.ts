import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { DataUtils } from '../../../../lib/util/Data.utils';
import { SnackBarUtils } from '../../../../lib/util/SnackBar.utils';
import { APP_ROUTES } from '../../../app.routes';
import { Address, AddressType } from '../../../shared/model/address.model';
import { CustomerSummary } from '../../../shared/model/customer.model';
import { Warehouse } from '../../../shared/model/inventory.model';
import { ManualOrderPreview, ManualOrderRequest, OFFLINE_PAYMENT_METHODS, PaymentMethod } from '../../../shared/model/manual-order.model';
import { Product, ProductVariant } from '../../../shared/model/product.model';
import { OrderFulfillment } from '../../../shared/model/commerce.model';
import { CustomerService } from '../../../shared/service/customer/customer.service';
import { ManualOrderService } from '../../../shared/service/manual-order/manual-order.service';
import { ScanCodeService } from '../../../shared/service/scan-code/scan-code.service';
import { ScanLookupMatch } from '../../../shared/model/scan-code.model';
import { SearchService } from '../../../shared/service/search/search.service';
import { WarehouseService } from '../../../shared/service/warehouse/warehouse.service';
import { ReceiptPrintUtil } from '../../../shared/util/receipt-print.util';
import { StoreSettingsService } from '../../../shared/service/store-settings/store-settings.service';

interface DraftLine { variantId: string; sku: string; name: string; productName: string; quantity: number; unitPrice: string; defaultPrice: string; digital: boolean; stock: number; }

// Commerce → New order: phone orders and counter sales (the POS in embryo).
// Customer (or walk-in) → lines (scan box or product search) → collected /
// ship (quote) → payment → Create. Totals come from the server preview so
// they match checkout to the cent; Create reuses the capture path.
@Component({
  selector: 'app-new-order',
  templateUrl: './new-order.component.html',
  styleUrls: ['./new-order.component.scss'],
  imports: [NgComponentModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatRadioModule, MatSlideToggleModule]
})
export class NewOrderComponent extends ViesMatFormFieldMap implements OnInit {

  private readonly rxjsUtils = inject(RxJSUtils);
  private readonly dialogUtils = inject(DialogUtils);
  private readonly router = inject(Router);
  private readonly storeSettings = inject(StoreSettingsService);
  private readonly customers = inject(CustomerService);
  private readonly manualOrders = inject(ManualOrderService);
  private readonly scanCodes = inject(ScanCodeService);
  private readonly search = inject(SearchService);
  private readonly warehouses = inject(WarehouseService);

  // ---- Customer ----
  customerQuery = signal<string>('');
  customerResults = signal<CustomerSummary[]>([]);
  customer = signal<CustomerSummary | null>(null);
  walkInName = signal<string>('');
  walkInEmail = signal<string>('');
  walkInPhone = signal<string>('');
  private customerDebounce?: ReturnType<typeof setTimeout>;

  // ---- Lines ----
  lines = signal<DraftLine[]>([]);
  scanValue = signal<string>('');
  productQuery = signal<string>('');
  productResults = signal<Product[]>([]);
  private productDebounce?: ReturnType<typeof setTimeout>;
  discountCode = signal<string>('');

  // ---- Fulfilment ----
  collected = signal<boolean>(true);
  address = signal<Address>(DataUtils.purgeValue(new Address()));
  readonly blankAddress = new Address();
  shippingRuleId = signal<string>('');
  warehouseList = signal<Warehouse[]>([]);
  warehouseId = signal<string>('');
  handedOver = signal<boolean>(true);
  notes = signal<string>('');

  // ---- Payment ----
  readonly paymentMethods = OFFLINE_PAYMENT_METHODS;
  paymentMethod = signal<PaymentMethod>('CASH');
  paymentReference = signal<string>('');
  amountTendered = signal<string>('');

  // ---- Preview / result ----
  preview = signal<ManualOrderPreview | null>(null);
  previewing = signal<boolean>(false);
  creating = signal<boolean>(false);
  created = signal<OrderFulfillment | null>(null);
  private previewDebounce?: ReturnType<typeof setTimeout>;

  hasCustomer = computed<boolean>(() => !!this.customer() || this.walkInName().trim().length > 0);
  shippingOptions = computed(() => (this.preview()?.shippingQuote?.options ?? []).filter(o => o.available));
  change = computed<string>(() => {
    const p = this.preview(); const t = Number(this.amountTendered());
    if (!p || this.paymentMethod() !== 'CASH' || !t) return '';
    return Math.max(0, t - Number(p.total)).toFixed(2);
  });
  // Cash tendered below the total: show the shortfall and block Create (FE-24; the server refuses too, BE-19).
  shortBy = computed<string>(() => {
    const p = this.preview(); const raw = this.amountTendered().trim();
    if (!p || this.paymentMethod() !== 'CASH' || !raw) return '';
    const t = Number(raw); if (Number.isNaN(t)) return '';
    return t < Number(p.total) ? (Number(p.total) - t).toFixed(2) : '';
  });
  canCreate = computed<boolean>(() =>
    this.hasCustomer() && this.lines().length > 0 && !!this.preview() && (this.preview()!.warnings.length === 0) && !this.shortBy()
    && (this.collected() || (!!this.address().country.trim() && !!this.shippingRuleId()))
    && !this.creating()
  );

  ngOnInit(): void {
    this.warehouses.getAll().subscribe({
      next: ws => { const active = (ws ?? []).filter(w => w.active); this.warehouseList.set(active); this.warehouseId.set(active.find(w => w.defaultWarehouse)?.id ?? active[0]?.id ?? ''); },
      error: () => {}
    });
  }

  // ---- Customer handlers ----
  onCustomerQuery(v: string) {
    this.customerQuery.set(v);
    clearTimeout(this.customerDebounce);
    if (!v.trim()) { this.customerResults.set([]); return; }
    this.customerDebounce = setTimeout(() => this.customers.list(v.trim(), 0, 8).subscribe({ next: r => this.customerResults.set(r.content), error: () => {} }), 300);
  }
  pickCustomer(c: CustomerSummary) { this.customer.set(c); this.customerResults.set([]); this.customerQuery.set(''); this.walkInName.set(''); this.schedulePreview(); }
  clearCustomer() { this.customer.set(null); this.schedulePreview(); }

  // ---- Line handlers ----
  ambiguousScan = signal<{ code: string; matches: ScanLookupMatch[] } | null>(null);
  pickScanMatch(m: ScanLookupMatch) {
    this.addVariant(m.variant, m.productName ?? '', String(m.effectivePrice ?? m.variant.effectivePrice ?? m.variant.price ?? '0'));
    this.ambiguousScan.set(null);
  }

  onScanKey(evt: KeyboardEvent) { if (evt.key === 'Enter') { evt.preventDefault(); this.scan(); } }

  scan() {
    const code = this.scanValue().trim();
    if (!code) return;
    this.scanCodes.lookup(code).subscribe({
      next: r => {
        if (r.matches.length === 0) { SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, `No variant carries "${code}"`, 'Dismiss', 4000); return; }
        if (r.matches.length > 1) {
          // Shared supplier alias: let the cashier pick, like the stock page does (FE-23).
          this.ambiguousScan.set({ code, matches: r.matches });
          this.scanValue.set('');
          return;
        }
        const m = r.matches[0];
        this.addVariant(m.variant, m.productName ?? '', String(m.effectivePrice ?? m.variant.effectivePrice ?? m.variant.price ?? '0'));
        this.scanValue.set('');
      },
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  onProductQuery(v: string) {
    this.productQuery.set(v);
    clearTimeout(this.productDebounce);
    if (!v.trim()) { this.productResults.set([]); return; }
    this.productDebounce = setTimeout(() => this.search.products({ q: v.trim(), size: 8 }).subscribe({ next: r => this.productResults.set(r.content), error: () => {} }), 300);
  }

  addFromProduct(p: Product, v: ProductVariant) {
    this.addVariant(v, p.name, String(v.effectivePrice ?? v.price ?? p.basePrice ?? '0'));
    this.productResults.set([]); this.productQuery.set('');
  }

  private addVariant(v: ProductVariant, productName: string, price: string) {
    const existing = this.lines().find(l => l.variantId === v.id);
    if (existing) { this.setQty(existing.variantId, existing.quantity + 1); return; }
    const line: DraftLine = { variantId: v.id, sku: v.sku, name: v.variantName || v.sku, productName, quantity: 1,
      unitPrice: Number(price).toFixed(2), defaultPrice: Number(price).toFixed(2), digital: v.fulfillmentType === 'DIGITAL', stock: Number(v.stockQuantity ?? 0) };
    this.lines.set([...this.lines(), line]);
    this.schedulePreview();
  }

  setQty(variantId: string, qty: number | string) {
    const q = Math.max(1, Math.floor(Number(qty) || 1));
    this.lines.set(this.lines().map(l => l.variantId === variantId ? { ...l, quantity: q } : l));
    this.schedulePreview();
  }
  setPrice(variantId: string, price: string) {
    this.lines.set(this.lines().map(l => l.variantId === variantId ? { ...l, unitPrice: price } : l));
    this.schedulePreview();
  }
  removeLine(variantId: string) { this.lines.set(this.lines().filter(l => l.variantId !== variantId)); this.schedulePreview(); }

  onDiscount(v: string) { this.discountCode.set(v); this.schedulePreview(); }
  onCollected(v: boolean) { this.collected.set(v); this.shippingRuleId.set(''); this.schedulePreview(); }
  onAddressChange(a: Address) { this.address.set({ ...a }); this.shippingRuleId.set(''); this.schedulePreview(); }
  onShippingRule(id: string) { this.shippingRuleId.set(id); this.schedulePreview(); }
  onPaymentMethod(m: PaymentMethod) { this.paymentMethod.set(m); }

  // ---- Preview / create ----
  private request(): ManualOrderRequest {
    const c = this.customer();
    return {
      customerId: c?.userId ?? null,
      walkIn: c ? null : { name: this.walkInName().trim(), email: this.walkInEmail().trim() || undefined, phone: this.walkInPhone().trim() || undefined },
      lines: this.lines().map(l => ({ productVariantId: l.variantId, quantity: l.quantity, unitPrice: l.unitPrice !== l.defaultPrice ? Number(l.unitPrice).toFixed(2) : null })),
      discountCode: this.discountCode().trim() || null,
      collected: this.collected(),
      shippingAddress: this.collected() ? null : { ...this.address(), type: AddressType.SHIPPING },
      billingAddress: this.collected() ? null : { ...this.address(), type: AddressType.BILLING },
      shippingRuleId: this.collected() ? null : (this.shippingRuleId() || null),
      warehouseId: this.warehouseId() || null,
      paymentMethod: this.paymentMethod(),
      paymentReference: this.paymentReference().trim() || null,
      amountTendered: this.amountTendered().trim() || null,
      handedOver: this.collected() && this.handedOver(),
      notes: this.notes().trim() || null
    };
  }

  private schedulePreview() {
    clearTimeout(this.previewDebounce);
    if (this.lines().length === 0) { this.preview.set(null); return; }
    this.previewDebounce = setTimeout(() => this.runPreview(), 300);
  }

  runPreview() {
    if (this.lines().length === 0) return;
    this.previewing.set(true);
    this.manualOrders.preview(this.request()).subscribe({
      next: p => {
        this.previewing.set(false); this.preview.set(p);
        // Preselect the recommended shipping method once a quote exists.
        if (!this.collected() && !this.shippingRuleId() && p.shippingQuote?.recommendedRuleId) this.shippingRuleId.set(p.shippingQuote.recommendedRuleId);
      },
      error: err => { this.previewing.set(false); this.preview.set(null); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  async create() {
    if (!this.canCreate()) return;
    const p = this.preview()!;
    const ok = await this.dialogUtils.openConfirmDialog('Create order?',
      `${this.lines().length} line(s), total ${Number(p.total).toFixed(2)} ${p.currency}, ${this.paymentMethod() === 'UNPAID' ? 'left UNPAID' : 'paid by ' + this.paymentMethod()}${this.collected() ? ', collected in store' : ''}. Stock moves now for paid orders.`,
      'Create', 'Cancel').catch(() => false);
    if (!ok) return;
    this.creating.set(true);
    this.manualOrders.create(this.request()).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: o => { this.creating.set(false); this.created.set(o); },
      error: err => { this.creating.set(false); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  printReceipt() {
    const o = this.created();
    if (!o) return;
    try { ReceiptPrintUtil.print(o, this.storeSettings.current() ?? this.storeSettings.publicInfo()); } catch (err) { this.dialogUtils.openErrorMessageFromError(err); }
  }

  openCreated() { const o = this.created(); if (o?.id) this.router.navigate([APP_ROUTES.commerceOrder(o.id)]); }
  startAnother() { this.created.set(null); this.lines.set([]); this.preview.set(null); this.customer.set(null); this.walkInName.set(''); this.walkInEmail.set(''); this.walkInPhone.set(''); this.discountCode.set(''); this.paymentReference.set(''); this.amountTendered.set(''); this.notes.set(''); }
  backToList() { this.router.navigate([APP_ROUTES.commerceOrderList]); }

  money(v: unknown): string { return Number(v ?? 0).toFixed(2); }
}
