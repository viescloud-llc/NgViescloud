import { ChangeDetectorRef, Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { LazyPageChange, MatTableLazyComponent } from '../mat-table-lazy/mat-table-lazy.component';
import { Observable, Subject } from 'rxjs';
import { DataUtils } from '../../util/Data.utils';
import { FunctionUtils } from '../../util/FunctionUtils';
import { Pageable } from '../../model/vies.model';
import { DialogUtils } from '../../util/Dialog.utils';
import { RxJSUtils } from '../../util/RxJS.utils';
import { MatTableDynamicComponent } from '../mat-table-dynamic/mat-table-dynamic.component';
import { RestUtils } from '../../util/Rest.utils';

@Component({
  selector: 'app-mat-table-lazy-dynamic',
  templateUrl: './mat-table-lazy-dynamic.component.html',
  styleUrls: ['./mat-table-lazy-dynamic.component.scss'],
  standalone: false
})
export class MatTableLazyDynamicComponent<T extends object, S> extends MatTableDynamicComponent<T, S> {

  matRowsPage!: Pageable<T>

  @Input()
  getAllPageableFn!: (service: S, page: number, size: number, sort?: string) => Observable<Pageable<T>> | Promise<Pageable<T>> | Pageable<T>;

  sendPageIndexChangeSubject = new Subject<void>();

  constructor(
    cd: ChangeDetectorRef,
    rxjsUtils: RxJSUtils,
    dialogUtils: DialogUtils
  ) {
    super(cd, rxjsUtils, dialogUtils);
  }

  override init() {
    this.cd.detectChanges();
    this.sendPageIndexChangeSubject.next(void 0);
  }

  onLazyPageChange(lazyPageChange: LazyPageChange) {
    FunctionUtils.toObservable(this.getAllPageableFn, [this.service, lazyPageChange.pageIndex, lazyPageChange.pageSize, RestUtils.formatSort(lazyPageChange)]).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.matRowsPage = res;
      }
    });
  }

  protected override removeRowFromTable(row: T): void {
    this.matRowsPage.content = this.matRowsPage.content.filter(r => DataUtils.isNotEqual(r, row));
  }

  protected override updateRow(row: T): void {
    this.matRowsPage.content = this.matRowsPage.content.map(r => {
      if(DataUtils.isEqual(r, this.selectedRowCopy)) {
        return row!;
      }
      else {
        return r;
      }
    });

    this.selectRow(row);
  }

  override selectRow(row: T | null): void {
    super.selectRow(row);

    if(!row) {
      this.init();
    }
  }

  protected override pushNewRow(row: T): void {
    if(this.matRowsPage._metadata.pageNumber === this.matRowsPage._metadata.totalPage) {
      if(this.matRowsPage.content.length < this.matRowsPage._metadata.pageSize) {
        this.matRowsPage.content.push(row);
      }
      else if(this.matRowsPage.content.length === this.matRowsPage._metadata.pageSize) {
        this.init();
      }
    }

    this.selectRow(row);
  }
}
