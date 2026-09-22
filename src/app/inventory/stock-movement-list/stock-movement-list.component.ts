import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { emptyPage, ListPage } from '../../shared/model/list-page.model';
import { SearchService } from '../../shared/service/search/search.service';
import { WarehouseService } from '../../shared/service/warehouse/warehouse.service';
import { ServerPagerComponent } from '../../shared/component/server-pager/server-pager.component';
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
  imports: [NgComponentModule, ServerPagerComponent]
})
export class StockMovementListComponent extends ViesMatFormFieldMap implements OnInit {

  protected readonly rxjsUtils = inject(RxJSUtils);
  protected readonly dialogUtils = inject(DialogUtils);
  protected readonly stockMovementService = inject(StockMovementService);

  // Server-side (GET /stock/movements/search): type, warehouse, free text
  // (reason, reference, SKU), creation-date range; paged, newest first.
  private readonly search = inject(SearchService);
  private readonly warehouseService = inject(WarehouseService);
  result = signal<ListPage<StockMovement>>(emptyPage());
  movements = computed<StockMovement[]>(() => this.result().content);
  blankMovement = new StockMovement();
  loading = signal<boolean>(false);

  searchTerm = signal<string>('');
  typeFilter = signal<StockMovementType | null>(null);
  warehouseFilter = signal<string | null>(null);
  from = signal<string>('');
  to = signal<string>('');
  page = signal<number>(0);
  size = signal<number>(25);
  private debounce?: ReturnType<typeof setTimeout>;

  typeOptions: MatOption<StockMovementType | null>[] = [
    { value: null, valueLabel: 'All types' },
    ...Object.values(StockMovementType).map(t => ({
      value: t as StockMovementType | null,
      valueLabel: t.charAt(0) + t.slice(1).toLowerCase()
    }))
  ];
  warehouseOptions = signal<MatOption<string | null>[]>([{ value: null, valueLabel: 'All warehouses' }]);

  ngOnInit(): void {
    this.warehouseService.getAll().subscribe({
      next: ws => this.warehouseOptions.set([{ value: null, valueLabel: 'All warehouses' }, ...(ws ?? []).map(w => ({ value: w.id as string | null, valueLabel: w.name }))]),
      error: () => {}
    });
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    this.search.movements({
      type: this.typeFilter() ?? undefined, warehouseId: this.warehouseFilter() ?? undefined,
      q: this.searchTerm().trim() || undefined, from: this.from() || undefined, to: this.to() || undefined,
      page: this.page(), size: this.size()
    }).subscribe({
      next: r => { this.result.set(r); this.loading.set(false); },
      error: err => { this.loading.set(false); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  onSearchTerm(v: string) {
    this.searchTerm.set(v);
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => { this.page.set(0); this.refresh(); }, 350);
  }
  onType(v: StockMovementType | null) { this.typeFilter.set(v); this.page.set(0); this.refresh(); }
  onWarehouse(v: string | null) { this.warehouseFilter.set(v); this.page.set(0); this.refresh(); }
  onFrom(v: string) { this.from.set(v); this.page.set(0); this.refresh(); }
  onTo(v: string) { this.to.set(v); this.page.set(0); this.refresh(); }
  onPage(p: number) { this.page.set(Math.max(0, p)); this.refresh(); }
  onSize(s: number) { this.size.set(s); this.page.set(0); this.refresh(); }

}
