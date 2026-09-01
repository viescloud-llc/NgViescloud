import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../lib/util/Dialog.utils';
import { MatOption } from '../../../lib/model/mat.model';
import { StockMovement, StockMovementType } from '../../shared/model/commerce.model';
import { StockMovementService } from '../../shared/service/stock-movement/stock-movement.service';

// Append-only stock audit log at /inventory/movements (intent § 5.6). Filters:
// movement type + free-text search on reason/reference. Read-only by design —
// corrections happen by adding a compensating ADJUSTMENT from the stock view,
// never by editing history.
@Component({
  selector: 'app-stock-movement-list',
  templateUrl: './stock-movement-list.component.html',
  styleUrls: ['./stock-movement-list.component.scss'],
  imports: [NgComponentModule]
})
export class StockMovementListComponent extends ViesMatFormFieldMap implements OnInit {

  protected readonly rxjsUtils = inject(RxJSUtils);
  protected readonly dialogUtils = inject(DialogUtils);
  protected readonly stockMovementService = inject(StockMovementService);

  movements = signal<StockMovement[]>([]);
  blankMovement = new StockMovement();

  searchTerm = signal<string>('');
  typeFilter = signal<StockMovementType | null>(null);

  typeOptions: MatOption<StockMovementType | null>[] = [
    { value: null, valueLabel: 'All types' },
    ...Object.values(StockMovementType).map(t => ({
      value: t as StockMovementType | null,
      valueLabel: t.charAt(0) + t.slice(1).toLowerCase()
    }))
  ];

  filteredMovements = computed<StockMovement[]>(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const type = this.typeFilter();
    return this.movements().filter(m => {
      if (type && m.movementType !== type) return false;
      if (!term) return true;
      return (m.reason || '').toLowerCase().includes(term)
          || (m.reference || '').toLowerCase().includes(term);
    });
  });

  ngOnInit(): void {
    this.refresh();
  }

  refresh() {
    this.stockMovementService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => this.movements.set(res),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
}
