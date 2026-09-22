import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../lib/util/Dialog.utils';
import { SnackBarUtils } from '../../../lib/util/SnackBar.utils';
import { AuthenticatorService } from '../../../lib/service/authenticator.service';
import { APP_ROUTES } from '../../app.routes';
import { LowStockRow, Warehouse } from '../../shared/model/inventory.model';
import { InventoryService } from '../../shared/service/inventory/inventory.service';
import { WarehouseService } from '../../shared/service/warehouse/warehouse.service';
import { QuickStockDialog } from '../../shared/component/quick-stock-dialog/quick-stock-dialog.component';

// Inventory → Low stock: variants at or below their line (variant → product →
// store default), on-order units from open POs, restock via the quick-stock
// dialog, and "send digest now" (goes to the LOW_STOCK_DIGEST recipients).
@Component({
  selector: 'app-low-stock',
  templateUrl: './low-stock.component.html',
  styleUrls: ['./low-stock.component.scss'],
  imports: [NgComponentModule, MatFormFieldModule, MatSelectModule, MatSlideToggleModule]
})
export class LowStockComponent extends ViesMatFormFieldMap implements OnInit {

  private readonly rxjsUtils = inject(RxJSUtils);
  private readonly dialogUtils = inject(DialogUtils);
  private readonly inventory = inject(InventoryService);
  private readonly warehouses = inject(WarehouseService);
  private readonly authenticatorService = inject(AuthenticatorService);
  private readonly router = inject(Router);

  rows = signal<LowStockRow[]>([]);
  warehouseList = signal<Warehouse[]>([]);
  warehouseId = signal<string>('');
  includeInactive = signal<boolean>(false);
  storeDefault = signal<number>(5);
  loading = signal<boolean>(false);
  canUpdate = computed<boolean>(() => this.authenticatorService.hasAuthorityOrAdmin('inventory:update'));
  outOfStock = computed<number>(() => this.rows().filter(r => r.onHand <= 0).length);

  ngOnInit(): void {
    this.warehouses.getAll().subscribe({ next: ws => this.warehouseList.set((ws ?? []).filter(w => w.active)), error: () => {} });
    this.inventory.lowStockSettings().subscribe({ next: s => this.storeDefault.set(s.storeDefault), error: () => {} });
    this.load();
  }

  load() {
    this.loading.set(true);
    this.inventory.lowStock(this.warehouseId() || null, this.includeInactive()).subscribe({
      next: rows => { this.loading.set(false); this.rows.set(rows ?? []); },
      error: err => { this.loading.set(false); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  onWarehouse(id: string) { this.warehouseId.set(id); this.load(); }
  onInactive(v: boolean) { this.includeInactive.set(v); this.load(); }

  openVariant(r: LowStockRow) { if (r.productId) this.router.navigate([APP_ROUTES.catalogProductVariant(r.productId, r.variantId)]); }

  restock(r: LowStockRow) {
    this.dialogUtils.matDialog.open(QuickStockDialog, {
      width: '520px',
      data: { variantId: r.variantId, sku: r.sku, variantName: r.variantName ?? undefined, currentStock: r.onHand,
        levels: r.levels.map(l => ({ id: l.warehouseId, productVariantId: r.variantId, quantity: l.quantity, warehouse: { id: l.warehouseId, code: l.warehouseCode, name: l.warehouseName } as Warehouse })),
        warehouseId: this.warehouseId() || undefined }
    }).afterClosed().subscribe(res => { if (res) this.load(); });
  }

  newPurchaseOrder() { this.router.navigate([APP_ROUTES.inventoryPurchaseOrderNew]); }

  sendDigest() {
    this.inventory.sendLowStockDigest().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: r => SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, r.sent ? `Digest (${r.items} item(s)) sent to ${r.recipients.join(', ')}` : (r.skippedReason || 'Not sent'), 'Dismiss', 7000),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  sourceLabel(r: LowStockRow): string { return r.thresholdSource === 'VARIANT' ? 'variant' : r.thresholdSource === 'PRODUCT' ? 'product default' : 'store default'; }
}
