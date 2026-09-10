import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ScanCodeService } from '../../shared/service/scan-code/scan-code.service';
import { ScanLookupResult } from '../../shared/model/scan-code.model';
import { APP_ROUTES } from '../../app.routes';
import { firstValueFrom } from 'rxjs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../lib/util/Dialog.utils';
import { DataUtils } from '../../../lib/util/Data.utils';
import { Product, ProductVariant } from '../../shared/model/product.model';
import { StockMovement, StockMovementType } from '../../shared/model/commerce.model';
import { ProductService } from '../../shared/service/product/product.service';
import { StockMovementService } from '../../shared/service/stock-movement/stock-movement.service';

// Row shape for the stock table — variant joined with its parent product name
// so admins can tell WHICH "Small / Red" they're looking at.
interface StockRow {
  productName: string;
  variant: ProductVariant;
}

// Per-variant stock view at /inventory/stock (intent § 5.6).
//
// Adjustments NEVER patch ProductVariant.stockQuantity directly — the
// quantity is denormalized from the movement log. The "Adjust" flow below
// POSTs a new StockMovement (type ADJUSTMENT) and re-fetches, letting the
// backend recompute the running total.
@Component({
  selector: 'app-stock',
  templateUrl: './stock.component.html',
  styleUrls: ['./stock.component.scss'],
  imports: [NgComponentModule, MatSlideToggleModule]
})
export class StockComponent extends ViesMatFormFieldMap implements OnInit {

  protected readonly rxjsUtils = inject(RxJSUtils);
  protected readonly dialogUtils = inject(DialogUtils);
  protected readonly productService = inject(ProductService);
  protected readonly stockMovementService = inject(StockMovementService);
  private readonly router = inject(Router);

  products = signal<Product[]>([]);

  searchTerm = signal<string>('');
  lowStockOnly = signal<boolean>(false);
  // "Low" = at or below this. Editable so different shops can set their own bar.
  lowStockThreshold = signal<number>(5);

  // ---- Scan lookup ---------------------------------------------------------
  //
  // A scanner types the code and presses Enter. Variant id → straight to the
  // variant editor; alias → one match opens it, several are listed; none → hint.
  private scanCodeService = inject(ScanCodeService);
  scanValue = signal<string>('');
  scanResult = signal<ScanLookupResult | null>(null);
  scanning = signal<boolean>(false);

  onScanKey(evt: KeyboardEvent) {
    if (evt.key === 'Enter') { evt.preventDefault(); this.runScan(); }
  }

  runScan() {
    const code = this.scanValue().trim();
    if (!code || this.scanning()) return;
    this.scanning.set(true);
    this.scanCodeService.lookup(code).subscribe({
      next: r => {
        this.scanning.set(false);
        this.scanResult.set(r);
        if (r.matches.length === 1 && r.matches[0].productId && r.matches[0].variant?.id) {
          this.router.navigate([APP_ROUTES.catalogProductVariant(r.matches[0].productId, r.matches[0].variant.id)]);
        }
      },
      error: err => { this.scanning.set(false); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  openScanMatch(productId?: string | null, variantId?: string) {
    if (!productId || !variantId) return;
    this.router.navigate([APP_ROUTES.catalogProductVariant(productId, variantId)]);
  }

  rows = computed<StockRow[]>(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const lowOnly = this.lowStockOnly();
    const threshold = this.lowStockThreshold();

    const all: StockRow[] = [];
    for (const p of this.products()) {
      for (const v of p.variants ?? []) {
        all.push({ productName: p.name || '(unnamed product)', variant: v });
      }
    }
    return all.filter(r => {
      if (lowOnly && r.variant.stockQuantity > threshold) return false;
      if (!term) return true;
      return r.productName.toLowerCase().includes(term)
          || (r.variant.variantName || '').toLowerCase().includes(term)
          || (r.variant.sku || '').toLowerCase().includes(term);
    });
  });

  isLow(row: StockRow): boolean {
    return row.variant.stockQuantity <= this.lowStockThreshold();
  }

  // ---- Adjustment flow -------------------------------------------------------

  // Which variant the adjustment panel is open for (null = closed).
  adjustingVariant = signal<ProductVariant | null>(null);
  adjustQuantity = signal<number>(0);
  adjustReason = signal<string>('');
  adjustReference = signal<string>('');

  canApplyAdjustment = computed<boolean>(() =>
    !!this.adjustingVariant()
    && this.adjustQuantity() !== 0
    && this.adjustReason().trim().length > 0
  );

  // The lib text input emits the raw string ("7"); StockMovement.quantityChange
  // is integer(int64) on the wire, so coerce before it ever hits the signal.
  onAdjustQuantityChange(v: number | string) {
    this.adjustQuantity.set(Number(v) || 0);
  }

  openAdjust(row: StockRow) {
    this.adjustingVariant.set(row.variant);
    this.adjustQuantity.set(0);
    this.adjustReason.set('');
    this.adjustReference.set('');
  }

  closeAdjust() {
    this.adjustingVariant.set(null);
  }

  async applyAdjustment() {
    const variant = this.adjustingVariant();
    if (!variant?.id || !this.canApplyAdjustment()) return;

    const movement = DataUtils.purgeValue(new StockMovement());
    movement.productVariant = { id: variant.id } as ProductVariant;
    movement.movementType = StockMovementType.ADJUSTMENT;
    movement.quantityChange = this.adjustQuantity();
    movement.reason = this.adjustReason().trim();
    movement.reference = this.adjustReference().trim();

    try {
      await firstValueFrom(
        this.stockMovementService.post(movement).pipe(this.rxjsUtils.waitLoadingDialog())
      );
      this.closeAdjust();
      this.refresh();
    } catch (err) {
      this.dialogUtils.openErrorMessageFromError(err);
    }
  }

  // ---- Data ------------------------------------------------------------------

  ngOnInit(): void {
    this.refresh();
  }

  refresh() {
    this.productService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => this.products.set(res),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
}
