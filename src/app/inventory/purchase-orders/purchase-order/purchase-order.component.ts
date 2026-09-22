import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { SnackBarUtils } from '../../../../lib/util/SnackBar.utils';
import { RouteUtils } from '../../../../lib/util/Route.utils';
import { ViesService } from '../../../../lib/service/rest.service';
import { APP_ROUTES } from '../../../app.routes';
import { PurchaseOrder, PurchaseOrderLine, Supplier, Warehouse } from '../../../shared/model/inventory.model';
import { Product, ProductVariant } from '../../../shared/model/product.model';
import { PurchaseOrderService } from '../../../shared/service/purchase-order/purchase-order.service';
import { SupplierService } from '../../../shared/service/supplier/supplier.service';
import { WarehouseService } from '../../../shared/service/warehouse/warehouse.service';
import { ScanCodeService } from '../../../shared/service/scan-code/scan-code.service';
import { SearchService } from '../../../shared/service/search/search.service';
import { HistoryPanelComponent } from '../../../shared/component/history-panel/history-panel.component';

// Purchase-order editor at /inventory/purchase-orders/{new,:id}. Header +
// lines are a plain form (POST/PUT); the lifecycle (place / receive / scan /
// cancel / close) are server actions that move stock. Received quantities are
// server-owned and shown read-only.
@Component({
  selector: 'app-purchase-order',
  templateUrl: './purchase-order.component.html',
  styleUrls: ['./purchase-order.component.scss'],
  imports: [NgComponentModule, MatFormFieldModule, MatSelectModule, HistoryPanelComponent]
})
export class PurchaseOrderComponent extends ViesMatFormFieldMap implements OnInit {

  private readonly rxjsUtils = inject(RxJSUtils);
  private readonly dialogUtils = inject(DialogUtils);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly purchaseOrders = inject(PurchaseOrderService);
  private readonly suppliers = inject(SupplierService);
  private readonly warehouses = inject(WarehouseService);
  private readonly scanCodes = inject(ScanCodeService);
  private readonly search = inject(SearchService);

  id = signal<string | null>(null);
  po = signal<PurchaseOrder | null>(null);
  baseline = signal<string>('');
  supplierList = signal<Supplier[]>([]);
  warehouseList = signal<Warehouse[]>([]);
  busy = signal<boolean>(false);

  // Draft header
  supplierId = signal<string>('');
  warehouseId = signal<string>('');
  expectedDate = signal<string>('');
  supplierReference = signal<string>('');
  notes = signal<string>('');
  lines = signal<PurchaseOrderLine[]>([]);

  // Add-line inputs
  scanValue = signal<string>('');
  productQuery = signal<string>('');
  productResults = signal<Product[]>([]);
  private productDebounce?: ReturnType<typeof setTimeout>;

  // Receiving
  receiveQty = signal<Record<string, number>>({});
  receiveScanValue = signal<string>('');
  receiveNote = signal<string>('');
  lastScan = signal<string>('');

  status = computed(() => this.po()?.status ?? 'DRAFT');
  editable = computed<boolean>(() => this.status() === 'DRAFT' || this.status() === 'ORDERED');
  receivable = computed<boolean>(() => this.status() === 'ORDERED' || this.status() === 'PARTIALLY_RECEIVED');
  totalCost = computed<number>(() => this.lines().reduce((s, l) => s + Number(l.unitCost ?? 0) * Number(l.quantityOrdered ?? 0), 0));
  totalOrdered = computed<number>(() => this.lines().reduce((s, l) => s + Number(l.quantityOrdered ?? 0), 0));
  totalReceived = computed<number>(() => this.lines().reduce((s, l) => s + Number(l.quantityReceived ?? 0), 0));
  dirty = computed<boolean>(() => this.snapshot() !== this.baseline());
  canSave = computed<boolean>(() => this.editable() && this.dirty() && !!this.supplierId() && this.lines().length > 0 && this.lines().every(l => Number(l.quantityOrdered) > 0) && !this.busy());
  currency = computed<string>(() => this.po()?.currency ?? this.supplierList().find(s => s.id === this.supplierId())?.currency ?? '');
  receiveTotal = computed<number>(() => Object.values(this.receiveQty()).reduce((s, q) => s + (Number(q) || 0), 0));

  ngOnInit(): void {
    if (ViesService.isNotCSR()) return;
    const rid = RouteUtils.getPathVariable('purchase-orders');
    this.id.set(rid === 'new' ? null : rid);
    this.suppliers.getAll().subscribe({ next: res => this.supplierList.set((res ?? []).filter(s => s.active || s.id === this.supplierId())), error: () => {} });
    this.warehouses.getAll().subscribe({
      next: ws => {
        const active = (ws ?? []).filter(w => w.active);
        this.warehouseList.set(active);
        if (!this.warehouseId()) this.warehouseId.set(active.find(w => w.defaultWarehouse)?.id ?? active[0]?.id ?? '');
      },
      error: () => {}
    });
    const id = this.id();
    if (id) this.load(id);
    else {
      const preset = this.route.snapshot.queryParamMap.get('supplierId');
      if (preset) this.supplierId.set(preset);
      this.baseline.set(this.snapshot());
    }
  }

  load(id: string) {
    this.purchaseOrders.get(id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: po => this.apply(po),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  private apply(po: PurchaseOrder) {
    this.po.set(po);
    this.id.set(po.id ?? null);
    this.supplierId.set((po.supplier as { id?: string } | null)?.id ?? '');
    this.warehouseId.set((po.warehouse as { id?: string } | null)?.id ?? '');
    this.expectedDate.set(po.expectedDate ?? '');
    this.supplierReference.set(po.supplierReference ?? '');
    this.notes.set(po.notes ?? '');
    this.lines.set((po.lines ?? []).map(l => ({ ...l, unitCost: l.unitCost == null ? '' : String(l.unitCost) })));
    const rq: Record<string, number> = {};
    (po.lines ?? []).forEach(l => { if (l.id) rq[l.id] = Number(l.quantityOutstanding ?? 0); });
    this.receiveQty.set(rq);
    this.baseline.set(this.snapshot());
  }

  private snapshot(): string {
    return JSON.stringify({ s: this.supplierId(), w: this.warehouseId(), e: this.expectedDate(), r: this.supplierReference(), n: this.notes(),
      l: this.lines().map(l => [l.productVariantId, Number(l.quantityOrdered), String(l.unitCost ?? '')]) });
  }

  private body(): PurchaseOrder {
    return {
      supplier: { id: this.supplierId() }, warehouse: this.warehouseId() ? { id: this.warehouseId() } : null,
      expectedDate: this.expectedDate().trim() || null, supplierReference: this.supplierReference().trim() || null, notes: this.notes().trim() || null,
      lines: this.lines().map(l => ({ id: l.id, productVariantId: l.productVariantId, quantityOrdered: Number(l.quantityOrdered), unitCost: String(l.unitCost ?? '').trim() === '' ? null : Number(l.unitCost).toFixed(4) }))
    };
  }

  onSupplier(id: string) {
    this.supplierId.set(id);
    const s = this.supplierList().find(x => x.id === id);
    if (s?.leadTimeDays && !this.expectedDate()) {
      const d = new Date(); d.setDate(d.getDate() + Number(s.leadTimeDays));
      this.expectedDate.set(d.toISOString().slice(0, 10));
    }
  }

  // ---- Lines ----
  onScanKey(evt: KeyboardEvent) { if (evt.key === 'Enter') { evt.preventDefault(); this.scanAdd(); } }

  scanAdd() {
    const code = this.scanValue().trim();
    if (!code) return;
    this.scanCodes.lookup(code).subscribe({
      next: r => {
        if (r.matches.length === 0) { SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, `No variant carries "${code}"`, 'Dismiss', 4000); return; }
        this.addVariant(r.matches[0].variant, r.matches[0].productName ?? '');
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

  addFromProduct(p: Product, v: ProductVariant) { this.addVariant(v, p.name); this.productResults.set([]); this.productQuery.set(''); }

  private addVariant(v: ProductVariant, productName: string) {
    if (v.fulfillmentType === 'DIGITAL') { SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, `${v.sku} is digital — nothing to purchase`, 'Dismiss', 4000); return; }
    const existing = this.lines().find(l => l.productVariantId === v.id);
    if (existing) { this.setLine(v.id, 'quantityOrdered', Number(existing.quantityOrdered) + 1); return; }
    this.lines.set([...this.lines(), { productVariantId: v.id, sku: v.sku, name: `${productName} — ${v.variantName || v.sku}`, quantityOrdered: 1, quantityReceived: 0, unitCost: '' }]);
  }

  setLine(variantId: string, field: 'quantityOrdered' | 'unitCost', value: string | number) {
    this.lines.set(this.lines().map(l => l.productVariantId === variantId ? { ...l, [field]: field === 'quantityOrdered' ? Math.max(0, Math.floor(Number(value) || 0)) : value } : l));
  }
  removeLine(variantId: string) { this.lines.set(this.lines().filter(l => l.productVariantId !== variantId)); }

  // ---- Save / actions ----
  save() {
    if (!this.canSave()) return;
    this.busy.set(true);
    const id = this.id();
    (id ? this.purchaseOrders.update(id, this.body()) : this.purchaseOrders.create(this.body())).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: po => {
        this.busy.set(false);
        SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, `${po.poNumber} saved`, 'Dismiss', 3000);
        if (!id && po.id) this.router.navigate([APP_ROUTES.inventoryPurchaseOrder(po.id)], { replaceUrl: true });
        this.apply(po);
      },
      error: err => { this.busy.set(false); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  revert() { const po = this.po(); if (po) this.apply(po); }

  private action(label: string, call: () => ReturnType<PurchaseOrderService['place']>) {
    this.busy.set(true);
    call().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: po => { this.busy.set(false); this.apply(po); SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, label, 'Dismiss', 4000); },
      error: err => { this.busy.set(false); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  async place() {
    const id = this.id(); if (!id) return;
    if (this.dirty()) { SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, 'Save your changes first', 'Dismiss', 3000); return; }
    const ok = await this.dialogUtils.openConfirmDialog('Place order?', `Mark ${this.po()?.poNumber} as ordered with the supplier (${this.totalOrdered()} units). Lines stay editable until receipts start.`, 'Place', 'Cancel').catch(() => false);
    if (ok) this.action('Order placed', () => this.purchaseOrders.place(id));
  }

  onReceiveQty(lineId: string, v: string | number) { this.receiveQty.set({ ...this.receiveQty(), [lineId]: Math.max(0, Math.floor(Number(v) || 0)) }); }

  async receiveEntered() {
    const id = this.id(); if (!id) return;
    const lines: Record<string, number> = {};
    for (const [k, q] of Object.entries(this.receiveQty())) if (q > 0) lines[k] = q;
    const n = Object.values(lines).reduce((s, q) => s + q, 0);
    if (n === 0) return;
    const ok = await this.dialogUtils.openConfirmDialog('Receive stock?', `Book ${n} unit(s) into ${this.warehouseName()} as PURCHASE movements referenced ${this.po()?.poNumber}.`, 'Receive', 'Cancel').catch(() => false);
    if (ok) this.action(`${n} unit(s) received`, () => this.purchaseOrders.receive(id, lines, this.receiveNote().trim() || undefined));
  }

  async receiveAll() {
    const id = this.id(); if (!id) return;
    const n = this.totalOrdered() - this.totalReceived();
    const ok = await this.dialogUtils.openConfirmDialog('Receive everything?', `Book all ${n} outstanding unit(s) into ${this.warehouseName()}.`, 'Receive all', 'Cancel').catch(() => false);
    if (ok) this.action('All outstanding units received', () => this.purchaseOrders.receive(id, {}, this.receiveNote().trim() || undefined));
  }

  onReceiveScanKey(evt: KeyboardEvent) { if (evt.key === 'Enter') { evt.preventDefault(); this.receiveScan(); } }

  receiveScan() {
    const id = this.id(); const code = this.receiveScanValue().trim();
    if (!id || !code) return;
    this.busy.set(true);
    this.purchaseOrders.receiveScan(id, code, 1).subscribe({
      next: po => {
        this.busy.set(false); this.apply(po); this.receiveScanValue.set('');
        const line = po.lines.find(l => l.quantityOutstanding !== undefined);
        this.lastScan.set(`✓ ${code}` + (line ? '' : ''));
        SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, `+1 received (${po.totalReceived}/${po.totalOrdered})`, 'Dismiss', 2500);
      },
      error: err => { this.busy.set(false); this.lastScan.set(`✗ ${code}`); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  async cancel() {
    const id = this.id(); if (!id) return;
    const ok = await this.dialogUtils.openConfirmDialog('Cancel order?', `Cancel ${this.po()?.poNumber}? Nothing will be received on it.`, 'Cancel order', 'Keep').catch(() => false);
    if (ok) this.action('Order cancelled', () => this.purchaseOrders.cancel(id));
  }

  async close() {
    const id = this.id(); if (!id) return;
    const ok = await this.dialogUtils.openConfirmDialog('Close short?', `Mark ${this.po()?.poNumber} as complete with ${this.totalReceived()}/${this.totalOrdered()} received; the rest is not coming.`, 'Close', 'Keep open').catch(() => false);
    if (ok) this.action('Order closed', () => this.purchaseOrders.close(id));
  }

  async remove() {
    const id = this.id(); if (!id) return;
    const ok = await this.dialogUtils.openConfirmDialog('Delete purchase order?', `Delete ${this.po()?.poNumber}? Only drafts and cancelled orders can be deleted.`, 'Delete', 'Cancel').catch(() => false);
    if (!ok) return;
    this.purchaseOrders.delete(id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({ next: () => this.backToList(), error: err => this.dialogUtils.openErrorMessageFromError(err) });
  }

  backToList() { this.router.navigate([APP_ROUTES.inventoryPurchaseOrderList]); }
  warehouseName(): string { return this.warehouseList().find(w => w.id === this.warehouseId())?.name ?? ''; }
  money(v: unknown): string { return Number(v ?? 0).toFixed(2); }
  lineTotal(l: PurchaseOrderLine): number { return Number(l.unitCost ?? 0) * Number(l.quantityOrdered ?? 0); }
}
