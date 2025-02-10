import { ChangeDetectorRef, Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { MatTableComponent } from '../mat-table/mat-table.component';
import { Observable } from 'rxjs';
import { FunctionUtils } from '../../util/FunctionUtils';
import { DataUtils } from '../../util/Data.utils';
import { RxJSUtils } from '../../util/RxJS.utils';
import { DialogUtils } from '../../util/Dialog.utils';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-mat-table-dynamic',
  templateUrl: './mat-table-dynamic.component.html',
  styleUrls: ['./mat-table-dynamic.component.scss']
})
export class MatTableDynamicComponent<I, T extends object, S> extends MatTableComponent<T> {

  @Input()
  getAllFn?: Observable<T[]> | Promise<T[]> | T[];

  @Input()
  getFn?: (object: T, service: S) => Observable<T> | Promise<T> | T

  @Input()
  addOrSaveFn?: (object: T, service: S) => void | Observable<T> | Promise<T> | T

  @Input()
  deleteFn?: (object: T, service: S) => void | Observable<T> | Promise<T> | T

  @Input()
  styleWidth: string = '100%';

  @Input()
  service?: S;

  @Output()
  onAddOrSaveFn: EventEmitter<T> = new EventEmitter<T>();

  @Output()
  onDeleteFn: EventEmitter<T> = new EventEmitter<T>();
  
  fetchSubscription?: any = null;
  selectedRow: T | null = null
  selectedRowCopy: T | null = null
  validForm = false;

  constructor(
    cd: ChangeDetectorRef,
    private rxjsUtils: RxJSUtils,
    private dialogUtils: DialogUtils
  ) {
      super(cd);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.init();
  }

  init() {
    if(this.getAllFn && !this.fetchSubscription) {
      this.fetchSubscription = FunctionUtils.applyObservable<T[]>(this.getAllFn).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
        next: res => {
          this.matRows = res;
          this.fetchSubscription = null;
        }
      })
    }
  }

  selectRow(row: T | null) {
    this.selectedRow = structuredClone(row);
    this.selectedRowCopy = structuredClone(this.selectedRow);
  }

  override editRow(row: T): void {
    this.onEditRow.emit(row);

    if(this.getFn && this.service) {
      FunctionUtils.applyObservable<T>(this.getFn(row, this.service), this.service).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
        next: res => {
          this.selectRow(res);
        },
        error: err => {
          this.dialogUtils.openErrorMessageFromError(err, "Error editing row", "Error when editing row\nPlease try again later");
        }
      })
    }
    else {
      this.selectRow(row);
    }
  }

  addNewRow() {
    this.selectRow(DataUtils.purgeValue(this.blankObject));
  }

  save() {
    if(this.selectedRow) {
      this.onAddOrSaveFn.emit(this.selectedRow);

      if(this.addOrSaveFn && this.service) {
        FunctionUtils.applyObservable<T | void>(this.addOrSaveFn(this.selectedRow, this.service), this.service).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
          next: res => {
            if(res != null && res != undefined) {
              this.matRows.push(res);
              this.selectRow(res);
            }
            else {
              this.editRow(this.selectedRow!);
            }

            this.init();
          },
          error: err => {
            this.dialogUtils.openErrorMessageFromError(err, "Error saving row", "Error when saving row\nPlease try again later");
          }
        });
      }
    }
  }

  revert() {
    this.selectedRow = structuredClone(this.selectedRowCopy);
  }

  isValueChange() {
    return DataUtils.isNotEqual(this.selectedRow, this.selectedRowCopy);
  }

  async deleteRow() {
    if(this.selectedRow) {
      this.onDeleteFn.emit(this.selectedRow);

      if(this.deleteFn && this.service) {
        let confirm = await this.dialogUtils.openConfirmDialog("Delete", "Are you sure you want to delete this row?\nThis cannot be undone", "Yes", "No");
      
        if(confirm) {
          FunctionUtils.applyObservable<T | void>(this.deleteFn(this.selectedRow, this.service), this.service).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
            next: res => {
              this.matRows = this.matRows.filter(row => DataUtils.isNotEqual(row, this.selectedRowCopy));
              this.selectRow(null);
              this.init();
            }
          })
        }
      }
    }
  }
}
