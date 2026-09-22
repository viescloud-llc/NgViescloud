import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../lib/util/Dialog.utils';
import { SnackBarUtils } from '../../../lib/util/SnackBar.utils';
import { InventoryLevel, Warehouse } from '../../shared/model/inventory.model';
import { Product, ProductVariant } from '../../shared/model/product.model';
import { StockMovement } from '../../shared/model/commerce.model';
import { InventoryService } from '../../shared/service/inventory/inventory.service';
import { ScanCodeService } from '../../shared/service/scan-code/scan-code.service';
import { SearchService } from '../../shared/service/search/search.service';
import { WarehouseService } from '../../shared/service/warehouse/warehouse.service';

interface PickedVariant { id: string; sku: string; name: string; productName: string; levels: InventoryLevel[]; }

// Inventory → Transfers: move units of one variant between warehouses. The
// server writes two TRANSFER movements under one TRF-… reference (out of the
// source, refused below zero; into the destination).
@Component({
  selector: 'app-transfer',
  templateUrl: './transfer.component.html',
  styleUrls: ['./transfer.component.scss'],
  imports: [NgComponentModule, MatFormFieldModule, MatSelectModule]
})
export class TransferComponent extends ViesMatFormFieldMap implements OnInit {

  private readonly rxjsUtils = inject(RxJSUtils);
  private readonly dialogUtils = inject(DialogUtils);
  private readonly inventory = inject(InventoryService);
  private readonly warehouses = inject(WarehouseService);
  private readonly scanCodes = inject(ScanCodeService);
  private readonly search = inject(SearchService);

  warehouseList = signal<Warehouse[]>([]);
  variant = signal<PickedVariant | null>(null);
  scanValue = signal<string>('');
  productQuery = signal<string>('');
  productResults = signal<Product[]>([]);
  private productDebounce?: ReturnType<typeof setTimeout>;

  fromId = signal<string>('');
  toId = signal<string>('');
  quantity = signal<number>(1);
  reason = signal<string>('');
  reference = signal<string>('');
  busy = signal<boolean>(false);

  recent = signal<StockMovement[]>([]);

  fromStock = computed<number>(() => Number(this.variant()?.levels.find(l => l.warehouse?.id === this.fromId())?.quantity ?? 0));
  toStock = computed<number>(() => Number(this.variant()?.levels.find(l => l.warehouse?.id === this.toId())?.quantity ?? 0));
  canTransfer = computed<boolean>(() => !!this.variant() && !!this.fromId() && !!this.toId() && this.fromId() !== this.toId()
    && this.quantity() > 0 && this.quantity() <= this.fromStock() && !this.busy());

  ngOnInit(): void {
    this.warehouses.getAll().subscribe({
      next: ws => {
        const active = (ws ?? []).filter(w => w.active);
        this.warehouseList.set(active);
        const def = active.find(w => w.defaultWarehouse)?.id ?? active[0]?.id ?? '';
        this.fromId.set(def);
        this.toId.set(active.find(w => w.id !== def)?.id ?? '');
      },
      error: () => {}
    });
    this.loadRecent();
  }

  loadRecent() {
    this.search.movements({ type: 'TRANSFER', size: 20 }).subscribe({ next: r => this.recent.set(r.content), error: () => {} });
  }

  onScanKey(evt: KeyboardEvent) { if (evt.key === 'Enter') { evt.preventDefault(); this.scan(); } }

  scan() {
    const code = this.scanValue().trim();
    if (!code) return;
    this.scanCodes.lookup(code).subscribe({
      next: r => {
        if (r.matches.length === 0) { SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, `No variant carries "${code}"`, 'Dismiss', 4000); return; }
        this.pick(r.matches[0].variant, r.matches[0].productName ?? '');
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

  pickFromProduct(p: Product, v: ProductVariant) { this.pick(v, p.name); this.productResults.set([]); this.productQuery.set(''); }

  private pick(v: ProductVariant, productName: string) {
    if (v.fulfillmentType === 'DIGITAL') { SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, `${v.sku} is digital — nothing to move`, 'Dismiss', 4000); return; }
    this.variant.set({ id: v.id, sku: v.sku, name: v.variantName || v.sku, productName, levels: v.inventoryLevels ?? [] });
    this.refreshLevels();
  }

  private refreshLevels() {
    const v = this.variant();
    if (!v) return;
    this.inventory.levelsForVariant(v.id).subscribe({ next: levels => this.variant.set({ ...v, levels: levels ?? [] }), error: () => {} });
  }

  levelFor(id: string): number { return Number(this.variant()?.levels.find(l => l.warehouse?.id === id)?.quantity ?? 0); }

  swap() { const f = this.fromId(); this.fromId.set(this.toId()); this.toId.set(f); }

  async transfer() {
    const v = this.variant();
    if (!v || !this.canTransfer()) return;
    const from = this.warehouseList().find(w => w.id === this.fromId())?.name;
    const to = this.warehouseList().find(w => w.id === this.toId())?.name;
    const ok = await this.dialogUtils.openConfirmDialog('Transfer stock?', `Move ${this.quantity()} × ${v.sku} from ${from} to ${to}.`, 'Transfer', 'Cancel').catch(() => false);
    if (!ok) return;
    this.busy.set(true);
    this.inventory.transfer({ variantId: v.id, fromWarehouseId: this.fromId(), toWarehouseId: this.toId(), quantity: this.quantity(),
      reason: this.reason().trim() || undefined, reference: this.reference().trim() || undefined }).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: r => {
        this.busy.set(false);
        SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, `${r.reference}: ${from} now ${r.fromQuantityAfter}, ${to} now ${r.toQuantityAfter}`, 'Dismiss', 6000);
        this.quantity.set(1); this.reason.set(''); this.reference.set('');
        this.refreshLevels(); this.loadRecent();
      },
      error: err => { this.busy.set(false); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  onQuantity(v: number | string) { this.quantity.set(Math.max(0, Math.floor(Number(v) || 0))); }
}
