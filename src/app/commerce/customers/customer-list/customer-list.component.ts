import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { APP_ROUTES } from '../../../app.routes';
import { CustomerPage, CustomerSummary } from '../../../shared/model/customer.model';
import { CustomerService } from '../../../shared/service/customer/customer.service';

// Customers at /commerce/customers/list — server-searched (username / email /
// alias), paged, sorted by last order. Click a row for the customer page.
@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.scss'],
  imports: [NgComponentModule]
})
export class CustomerListComponent extends ViesMatFormFieldMap implements OnInit {

  protected readonly rxjsUtils = inject(RxJSUtils);
  protected readonly dialogUtils = inject(DialogUtils);
  private readonly customerService = inject(CustomerService);
  private readonly router = inject(Router);

  search = signal<string>('');
  page = signal<number>(0);
  readonly size = 25;
  result = signal<CustomerPage | null>(null);
  loading = signal<boolean>(false);

  rows = computed<CustomerSummary[]>(() => this.result()?.content ?? []);
  total = computed<number>(() => this.result()?.total ?? 0);
  pageCount = computed<number>(() => Math.max(1, Math.ceil(this.total() / this.size)));

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.customerService.list(this.search(), this.page(), this.size).subscribe({
      next: r => { this.result.set(r); this.loading.set(false); },
      error: err => { this.loading.set(false); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  onSearchKey(evt: KeyboardEvent) {
    if (evt.key === 'Enter') { this.page.set(0); this.load(); }
  }

  runSearch() { this.page.set(0); this.load(); }
  prev() { if (this.page() > 0) { this.page.set(this.page() - 1); this.load(); } }
  next() { if (this.page() + 1 < this.pageCount()) { this.page.set(this.page() + 1); this.load(); } }

  open(c: CustomerSummary) {
    this.router.navigate([APP_ROUTES.commerceCustomer(c.userId)]);
  }

  ltv(c: CustomerSummary): string {
    const entries = Object.entries(c.lifetimeValueByCurrency ?? {});
    if (entries.length === 0) return '—';
    return entries.map(([cur, v]) => `${Number(v).toFixed(2)} ${cur}`).join(' · ');
  }

  when(d?: { date?: string; time?: string } | null): string {
    return d?.date ? `${d.date}${d.time ? ' ' + d.time.slice(0, 5) : ''}` : '—';
  }
}
