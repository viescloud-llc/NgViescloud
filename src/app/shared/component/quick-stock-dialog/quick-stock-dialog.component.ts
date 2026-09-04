import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { DataUtils } from '../../../../lib/util/Data.utils';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { StockMovement, StockMovementType } from '../../model/commerce.model';
import { ProductVariant } from '../../model/product.model';
import { StockMovementService } from '../../service/stock-movement/stock-movement.service';

export interface QuickStockDialogData {
  variantId: string;
  sku: string;
  variantName?: string;
  currentStock: number;
}

// One-shot "add stock" popup for a single variant. Posts a StockMovement — the
// SERVER applies the delta and stamps quantityAfter (the supported way to move
// stock outside checkout), so the ledger and the balance never diverge. Closes
// with the persisted movement so the caller can show the new balance.
@Component({
  selector: 'app-quick-stock-dialog',
  templateUrl: './quick-stock-dialog.component.html',
  styleUrls: ['./quick-stock-dialog.component.scss'],
  imports: [NgComponentModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule]
})
export class QuickStockDialog extends ViesMatFormFieldMap {

  private dialogRef = inject(MatDialogRef<QuickStockDialog, StockMovement | undefined>);
  readonly data = inject<QuickStockDialogData>(MAT_DIALOG_DATA);
  private stockMovementService = inject(StockMovementService);
  private rxjsUtils = inject(RxJSUtils);
  private dialogUtils = inject(DialogUtils);

  readonly typeOptions: { value: StockMovementType; label: string; hint: string }[] = [
    { value: StockMovementType.PURCHASE,   label: 'Purchase (stock received)', hint: 'Adds the quantity.' },
    { value: StockMovementType.RETURN,     label: 'Return (customer sent back)', hint: 'Adds the quantity.' },
    { value: StockMovementType.ADJUSTMENT, label: 'Adjustment (count correction)', hint: 'Signed: positive adds, negative removes.' },
    { value: StockMovementType.DAMAGE,     label: 'Damage / write-off', hint: 'Removes the quantity.' },
    { value: StockMovementType.TRANSFER,   label: 'Transfer out', hint: 'Removes the quantity.' }
  ];

  movementType = signal<StockMovementType>(StockMovementType.PURCHASE);
  quantity = signal<number>(0);
  reason = signal<string>('');
  reference = signal<string>('');

  // What actually gets posted: DAMAGE/TRANSFER are removals, PURCHASE/RETURN
  // additions; ADJUSTMENT is taken as typed (signed).
  signedChange = computed<number>(() => {
    const q = this.quantity();
    switch (this.movementType()) {
      case StockMovementType.DAMAGE:
      case StockMovementType.TRANSFER:
        return -Math.abs(q);
      case StockMovementType.ADJUSTMENT:
        return q;
      default:
        return Math.abs(q);
    }
  });

  projectedStock = computed<number>(() => this.data.currentStock + this.signedChange());
  typeHint = computed<string>(() => this.typeOptions.find(t => t.value === this.movementType())?.hint ?? '');

  canApply = computed<boolean>(() =>
    this.signedChange() !== 0 && this.projectedStock() >= 0 && this.reason().trim().length > 0
  );

  onQuantityChange(v: number | string) {
    this.quantity.set(Number(v) || 0);
  }

  apply() {
    if (!this.canApply()) return;
    const movement = DataUtils.purgeValue(new StockMovement());
    movement.productVariant = { id: this.data.variantId } as ProductVariant;
    movement.movementType = this.movementType();
    movement.quantityChange = this.signedChange();
    movement.reason = this.reason().trim();
    movement.reference = this.reference().trim();

    this.stockMovementService.post(movement)
      .pipe(this.rxjsUtils.waitLoadingDialog())
      .subscribe({
        next: saved => this.dialogRef.close(saved),
        error: err => this.dialogUtils.openErrorMessageFromError(err)
      });
  }

  cancel() {
    this.dialogRef.close(undefined);
  }
}
