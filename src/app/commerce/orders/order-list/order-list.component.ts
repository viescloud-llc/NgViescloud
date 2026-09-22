import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { MatOption } from '../../../../lib/model/mat.model';
import { APP_ROUTES } from '../../../app.routes';
import { OrderFulfillment, FulfillmentStatus } from '../../../shared/model/commerce.model';
import { emptyPage, ListPage } from '../../../shared/model/list-page.model';
import { SearchService } from '../../../shared/service/search/search.service';
import { ServerPagerComponent } from '../../../shared/component/server-pager/server-pager.component';
import { AuthenticatorService } from '../../../../lib/service/authenticator.service';

// Order queue at /commerce/orders/list — filtered, searched and paged on the
// SERVER (GET /orders/search): status, free text (order number, company,
// notes), creation-date range, optional customer (from the customer page).
// Newest first. Click a row to open the detail editor.
@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss'],
  imports: [NgComponentModule, ServerPagerComponent]
})
export class OrderListComponent extends ViesMatFormFieldMap implements OnInit {

  protected readonly rxjsUtils = inject(RxJSUtils);
  protected readonly dialogUtils = inject(DialogUtils);
  private readonly search = inject(SearchService);
  protected readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authenticatorService = inject(AuthenticatorService);
  canCreate = computed<boolean>(() => this.authenticatorService.hasAuthorityOrAdmin('orders:create'));

  newOrder() { this.router.navigate([APP_ROUTES.commerceOrderNew]); }

  result = signal<ListPage<OrderFulfillment>>(emptyPage());
  orders = computed<OrderFulfillment[]>(() => this.result().content);
  blankOrder = new OrderFulfillment();
  loading = signal<boolean>(false);

  searchTerm = signal<string>('');
  statusFilter = signal<FulfillmentStatus | null>(null);
  from = signal<string>('');
  to = signal<string>('');
  customerId = signal<string>('');
  page = signal<number>(0);
  size = signal<number>(25);
  private debounce?: ReturnType<typeof setTimeout>;

  statusOptions: MatOption<FulfillmentStatus | null>[] = [
    { value: null, valueLabel: 'All statuses' },
    ...Object.values(FulfillmentStatus).map(s => ({ value: s as FulfillmentStatus | null, valueLabel: s.charAt(0) + s.slice(1).toLowerCase().replace('_', ' ') }))
  ];

  ngOnInit(): void {
    this.customerId.set(this.route.snapshot.queryParamMap.get('customerId') ?? '');
    this.load();
  }

  load() {
    this.loading.set(true);
    this.search.orders({
      status: this.statusFilter() ?? undefined, q: this.searchTerm().trim() || undefined,
      customerId: this.customerId() || undefined, from: this.from() || undefined, to: this.to() || undefined,
      page: this.page(), size: this.size()
    }).subscribe({
      next: r => { this.result.set(r); this.loading.set(false); },
      error: err => { this.loading.set(false); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  onSearchTerm(v: string) {
    this.searchTerm.set(v);
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.resetAndLoad(), 350);
  }

  onStatus(v: FulfillmentStatus | null) { this.statusFilter.set(v); this.resetAndLoad(); }
  onFrom(v: string) { this.from.set(v); this.resetAndLoad(); }
  onTo(v: string) { this.to.set(v); this.resetAndLoad(); }
  clearCustomer() { this.customerId.set(''); this.resetAndLoad(); }
  onPage(p: number) { this.page.set(Math.max(0, p)); this.load(); }
  onSize(s: number) { this.size.set(s); this.resetAndLoad(); }

  private resetAndLoad() { this.page.set(0); this.load(); }

  refresh() { this.load(); }

  selectOrder(order: OrderFulfillment) {
    if (!order.id) return;
    this.router.navigate([APP_ROUTES.commerceOrder(order.id)]);
  }
}
