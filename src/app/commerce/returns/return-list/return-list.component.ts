import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
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
  imports: [NgComponentModule]
})
export class ReturnListComponent extends ViesMatFormFieldMap implements OnInit {

  protected readonly rxjsUtils = inject(RxJSUtils);
  protected readonly dialogUtils = inject(DialogUtils);
  protected readonly returnService = inject(ReturnRequestService);
  protected readonly router = inject(Router);

  returns = signal<ReturnRequest[]>([]);
  blankReturn = new ReturnRequest();

  searchTerm = signal<string>('');
  statusFilter = signal<ReturnStatus | null>(null);

  statusOptions: MatOption<ReturnStatus | null>[] = [
    { value: null, valueLabel: 'All statuses' },
    ...Object.values(ReturnStatus).map(s => ({
      value: s as ReturnStatus | null,
      valueLabel: s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ')
    }))
  ];

  filteredReturns = computed<ReturnRequest[]>(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();
    return this.returns().filter(r => {
      if (status && r.status !== status) return false;
      if (!term) return true;
      return (r.returnNumber || '').toLowerCase().includes(term);
    });
  });

  ngOnInit(): void {
    this.refresh();
  }

  refresh() {
    this.returnService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => this.returns.set(res),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  addReturn() {
    this.router.navigate([APP_ROUTES.commerceReturnNew]);
  }

  selectReturn(ret: ReturnRequest) {
    if (!ret.id) return;
    this.router.navigate([APP_ROUTES.commerceReturn(ret.id)]);
  }
}
