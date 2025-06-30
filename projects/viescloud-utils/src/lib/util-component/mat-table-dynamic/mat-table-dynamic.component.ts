import { ChangeDetectorRef, Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { MatTableComponent } from '../mat-table/mat-table.component';
import { firstValueFrom, Observable } from 'rxjs';
import { FunctionUtils } from '../../util/FunctionUtils';
import { DataUtils } from '../../util/Data.utils';
import { RxJSUtils } from '../../util/RxJS.utils';
import { DialogUtils } from '../../util/Dialog.utils';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-mat-table-dynamic',
  templateUrl: './mat-table-dynamic.component.html',
  styleUrls: ['./mat-table-dynamic.component.scss'],
  standalone: false
})
export class MatTableDynamicComponent<T extends object, S> extends MatTableComponent<T> {

  @Input()
  getAllFn?: Observable<T[]> | Promise<T[]> | T[];

  @Input()
  getFn?: (object: T, service: S) => Observable<T> | Promise<T> | T

  @Input()
  addOrSaveFn?: (object: T, service: S) => void | Observable<T> | Promise<T> | T

  @Input()
  deleteFn?: (object: T, service: S) => void | Observable<T> | Promise<T> | T

  @Input()
  cloneFn?: (object: T) => T

  @Input()
  styleWidth: string = '100%';

  @Input()
  service!: S;

  @Input()
  showMultipleRowSelectionButton = false;

  @Output()
  onAddOrSaveFn: EventEmitter<T> = new EventEmitter<T>();

  @Output()
  onDeleteFn: EventEmitter<T> = new EventEmitter<T>();
  
  fetchSubscription?: any = null;
  selectedRow: T | null = null
  selectedRows: T[] = [];
  selectedRowCopy: T | null = null
  validForm = false;
  newRow = false;

  constructor(
    cd: ChangeDetectorRef,
    protected rxjsUtils: RxJSUtils,
    protected dialogUtils: DialogUtils
  ) {
      super(cd);
  }

  override ngOnInit(): void {
    this.init();
  }

  override ngOnChanges(changes: SimpleChanges): void {
    
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

  protected updateRow(row: T) {
    this.matRows = this.matRows.map(r => {
      if(DataUtils.isEqual(r, this.selectedRowCopy)) {
        return row;
      }
      else {
        return r;
      }
    });

    this.selectRow(row);
  }

  selectRow(row: T | null) {
    this.newRow = false;
    this.selectedRow = structuredClone(row);
    this.selectedRowCopy = structuredClone(this.selectedRow);
  }

  override editRow(row: T): void {
    this.onEditRow.emit(row);

    if(this.getFn && this.service) {
      FunctionUtils.toObservable(this.getFn, [row,  this.service]).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
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
    this.newRow = true;
  }

  protected pushNewRow(row: T) {
    this.matRows.push(row);
    this.selectRow(row);
  }

  cloneRow() {
    if(this.selectedRow && this.cloneFn) {
      this.selectRow(structuredClone(this.cloneFn(this.selectedRow)));
      this.newRow = true;
    }
  }

  save() {
    if(this.selectedRow) {
      this.onAddOrSaveFn.emit(this.selectedRow);

      if(this.addOrSaveFn && this.service) {
        FunctionUtils.toObservable(this.addOrSaveFn, [this.selectedRow, this.service]).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
          next: res => {
            if(res != null && res != undefined) {
              if(this.newRow) {
                this.pushNewRow(res);
              }
              else {
                this.updateRow(res);
              }
            }
            else {
              this.editRow(this.selectedRow!);
            }
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

  protected removeRowFromTable(row: T) {
    this.matRows = this.matRows.filter(r => DataUtils.isNotEqual(r, row));
  }

  async deleteRow(selectedRow: T, confirmation = true) {
    if(selectedRow) {
      this.onDeleteFn.emit(selectedRow);

      if(this.deleteFn && this.service) {
        if (confirmation) {
          let confirm = await this.dialogUtils.openConfirmDialog("Delete", "Are you sure you want to delete this row?\nThis cannot be undone", "Yes", "No");
        
          if(!confirm) {
            return;
          }
        }

        await firstValueFrom(FunctionUtils.toObservable(this.deleteFn, [selectedRow, this.service]).pipe(this.rxjsUtils.waitLoadingDialog()))
        .then(res => {
            this.removeRowFromTable(structuredClone(this.selectedRowCopy!));
            this.selectRow(null);
        })
        .catch(err => {
          if (confirmation) {
            this.dialogUtils.openErrorMessageFromError(err, "Error deleting row", "Error when deleting row\nPlease try again later");
          }
        });
      }
    }
  }

  async deleteRows(rows: T[]) {
    if(rows && rows.length > 0) {
      let confirm = await this.dialogUtils.openConfirmDialog("Delete", "Are you sure you want to delete these rows?\nThis cannot be undone", "Yes", "No");
        
      if(!confirm) {
        return;
      }

      for (let row of rows) {
        await this.deleteRow(row, false);
      }

      this.init();
    }
  }

  multipleRowSelectedFn(rows: T[]) {
    this.onMultipleRowSelected.emit(rows);
    this.selectedRows = rows;
  }

  pageIndexChange(pageIndex: number) {
    this.pageIndex = pageIndex;
    this.onPageIndexChange.emit(pageIndex);
  }
}
