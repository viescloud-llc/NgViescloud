import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { emptyPage, ListPage } from '../../../shared/model/list-page.model';
import { SearchService } from '../../../shared/service/search/search.service';
import { ServerPagerComponent } from '../../../shared/component/server-pager/server-pager.component';
import { ActivatedRoute, Router } from '@angular/router';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { MatOption } from '../../../../lib/model/mat.model';
import { APP_ROUTES } from '../../../app.routes';
import { ReturnRequest, ReturnStatus } from '../../../shared/model/commerce.model';
import { ReturnRequestService } from '../../../shared/service/return-request/return-request.service';

// RMA queue at /commerce/returns/list. ReturnStatus filter + free-text search
// on returnNumber. Rows open the return editor (approve/reject, refund, etc.).
@Component({
  selector: 'app-return-list',
  templateUrl: './return-list.component.html',
  styleUrls: ['./return-list.component.scss'],
  imports: [NgComponentModule, ServerPagerComponent]
})
export class ReturnListComponent extends ViesMatFormFieldMap implements OnInit {

  protected readonly rxjsUtils = inject(RxJSUtils);
  protected readonly dialogUtils = inject(DialogUtils);
  protected readonly returnService = inject(ReturnRequestService);
  protected readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Server-side (GET /returns/search): status, free text (return / order number,
  // reason), paged, newest first.
  private readonly search = inject(SearchService);
  result = signal<ListPage<ReturnRequest>>(emptyPage());
  returns = computed<ReturnRequest[]>(() => this.result().content);
  blankReturn = new ReturnRequest();
  loading = signal<boolean>(false);

  searchTerm = signal<string>('');
  statusFilter = signal<ReturnStatus | null>(null);
  page = signal<number>(0);
  size = signal<number>(25);
  private debounce?: ReturnType<typeof setTimeout>;

  statusOptions: MatOption<ReturnStatus | null>[] = [
    { value: null, valueLabel: 'All statuses' },
    ...Object.values(ReturnStatus).map(s => ({ value: s as ReturnStatus | null, valueLabel: s.charAt(0) + s.slice(1).toLowerCase() }))
  ];

  ngOnInit(): void {
    const qs = this.route.snapshot.queryParamMap.get('status'); if (qs && (Object.values(ReturnStatus) as string[]).includes(qs)) this.statusFilter.set(qs as ReturnStatus);
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    this.search.returns({ status: this.statusFilter() ?? undefined, q: this.searchTerm().trim() || undefined, page: this.page(), size: this.size() })
      .subscribe({
        next: r => { this.result.set(r); this.loading.set(false); },
        error: err => { this.loading.set(false); this.dialogUtils.openErrorMessageFromError(err); }
      });
  }

  onSearchTerm(v: string) {
    if (v === this.searchTerm()) return; // lib inputs re-emit on focusout — same query = no reload (FE-21)
    this.searchTerm.set(v);
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => { this.page.set(0); this.refresh(); }, 350);
  }
  onStatus(v: ReturnStatus | null) { this.statusFilter.set(v); this.page.set(0); this.refresh(); }
  onPage(p: number) { this.page.set(Math.max(0, p)); this.refresh(); }
  onSize(s: number) { this.size.set(s); this.page.set(0); this.refresh(); }

  addReturn() {
    this.router.navigate([APP_ROUTES.commerceReturnNew]);
  }

  selectReturn(ret: ReturnRequest) {
    if (!ret.id) return;
    this.router.navigate([APP_ROUTES.commerceReturn(ret.id)]);
  }
}
