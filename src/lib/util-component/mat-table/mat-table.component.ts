import { AfterContentInit, AfterViewInit, ChangeDetectorRef, Component, ContentChild, ContentChildren, Directive, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';
import { MatColumnDef, MatTable, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatColumn, MatTableSettingType } from '../../model/mat.model';
import { DataUtils } from '../../util/Data.utils';
import { SelectionModel } from '@angular/cdk/collections';

@Component({
  selector: 'app-mat-table',
  templateUrl: './mat-table.component.html',
  styleUrls: ['./mat-table.component.scss'],
  standalone: false
})
export class MatTableComponent<T extends object> implements OnInit, OnChanges, AfterViewInit, AfterContentInit {

  @Input()
  filterDisplay: number = 0;

  @Input()
  matRows: T[] = [];

  matColumns: MatColumn[] = [];

  @Input()
  pageSizeOptions: number[] = [5, 10, 25, 100];

  @Input()
  showFilter: boolean = false;

  @Input()
  showPagination: boolean = false;

  @Input()
  showMultipleRowSelection: boolean = false;

  @Input()
  initSort?: {key: string, order: 'asc' | 'desc' };

  @Input()
  blankObject?: any;

  @Input()
  showMatTooltip: boolean = false;
  prefixColumns: string[] = ['multipleRowSelection'];
  extraColumns: string[] = [];

  @Input()
  pageIndex: number = 0;

  @Output()
  onEditRow: EventEmitter<T> = new EventEmitter();

  @Output()
  onMiddleClickRow: EventEmitter<T> = new EventEmitter();

  @Output()
  onPageIndexChange: EventEmitter<number> = new EventEmitter<number>();

  @Output()
  onMultipleRowSelected: EventEmitter<T[]> = new EventEmitter<T[]>();

  displayedColumns: string[] = [];

  dataSource = new MatTableDataSource(this.matRows);

  filter?: string;

  multipleRowSelected = new SelectionModel<T>(true, []);

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;

  @ViewChild(MatSort)
  sort!: MatSort;

  @ContentChildren(MatColumnDef) columnDefs?: QueryList<MatColumnDef>;
  @ViewChild(MatTable, { static: true }) table!: MatTable<any>;

  constructor(
    protected cd: ChangeDetectorRef
  ) { }
  
  ngAfterContentInit(): void {
    let elements = this.columnDefs?.toArray();
    if(elements) {
      elements.forEach(e => {
        this.extraColumns.push(e.name);
        this.table.addColumnDef(e);
      })

      this.ngOnInit();
    }
  }

  ngAfterViewInit(): void {
    if(this.initSort) {
      this.sort.active = this.initSort.key;
      this.sort.direction = this.initSort.order;
    }

    if(this.pageIndex) {
      this.paginator.pageIndex = this.pageIndex;
    }
    
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.ngOnInit();
    this.cd.detectChanges();
  }

  ngOnInit() {
    this.matColumns = [];
    this.displayedColumns = [];
    this.populateMatColumn();
    this.filterColumns();

    this.pageSizeOptions = this.pageSizeOptions.sort((a, b) => a - b);
    this.dataSource.data = this.matRows;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['matRows']) {
      this.multipleRowSelected.clear();
    }
    
    if(changes['matRows'] || changes['showMultipleRowSelection']) {
      this.ngOnInit();
    }
  }

  private populateMatColumn(): void {
    if(!this.blankObject) {
      this.fillColumns();
      return;
    }

    let index = 100;
    for (const [key] of Object.entries(this.blankObject)) {
      if(!this.isHide(key)) {
        this.matColumns.push({
          key: key.toString(),
          index: this.getDisplayColumIndex(key, index),
          label: this.getDisplayLabel(key),
          getDisplayValueFn: this.getDisplayValueFn(key)
        });
      }
      index++;
    }
  }

  private getDisplayLabel(key: string): string {
    let prototype = Object.getPrototypeOf(this.blankObject!);
    let name = key + MatTableSettingType.DISPLAY_LABEL.toString();
    if (Object.hasOwn(prototype, name))
      return prototype[name] as string;
    else
      return key;
  }

  private getDisplayValueFn(key: string): ((obj: any) => any)  | undefined {
    let prototype = Object.getPrototypeOf(this.blankObject!);
    let name = key + MatTableSettingType.DISPLAY_VALUE_FN.toString();
    if (Object.hasOwn(prototype, name))
      return prototype[name] as ((obj: any) => any);
    else
      return undefined;
  }

  private isHide(key: string): boolean {
    let prototype = Object.getPrototypeOf(this.blankObject!);
    let name = key + MatTableSettingType.HIDE.toString();
    return Object.hasOwn(prototype, name) && !!prototype[name];
  }

  private getDisplayColumIndex(key: string, defaultIndex: number): number {
    let prototype = Object.getPrototypeOf(this.blankObject!);
    let name = key + MatTableSettingType.INDEX.toString();
    if (Object.hasOwn(prototype, name))
      return prototype[name] as number;
    else
      return defaultIndex;
  }

  private fillColumns(): void {
    let index = 0;

    if (this.matRows.length > 0) {
      for (const [key, value] of Object.entries(this.matRows[0])) {
        this.matColumns.push({
          key: key.toString(),
          index: index,
          label: value
        })
        index++;
      }
    }
  }

  private filterColumns() {
    if(this.showMultipleRowSelection) {
      this.displayedColumns.push(this.prefixColumns[0]);
    }
    
    if (this.matColumns) {
      this.matColumns = this.matColumns.sort((a, b) => a.index - b.index);
      this.matColumns.forEach(e => {
        this.displayedColumns.push(e.key);
      });
    }

    if (this.extraColumns) {
      this.extraColumns.forEach(e => {
        if(e) {
          this.displayedColumns.push(e);
        }
      });
    }
  }

  getValue(element: object, label: string): any {
    let matLabel = this.getColumnSetting(label);
    if (matLabel.getDisplayValueFn)
      return matLabel.getDisplayValueFn(element)

    for (const [keyT, value] of Object.entries(element)) {
      if (keyT === label)
        return value;
    }

    return "";
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearFilter() {
    this.dataSource.filter = '';

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  editRow(row: T, event?: MouseEvent) {
    if (event) {
      if (event.button === 1) {
        this.onMiddleClickRow.emit(row);
      }
    }
    else {
      this.onEditRow.emit(row);
    }
  }

  getColumnSetting(label: string): MatColumn {
    let index = this.matColumns.findIndex(e => e.key === label || e.label === label);
    return this.matColumns[index];
  }

  getLabel(label: string): string {
    let matColumn = this.getColumnSetting(label);
    if (matColumn.label)
      return matColumn.label;
    else
      return label;
  }

  getFilterWarning() {
    if(this.matRows && this.matRows.length && this.matRows.length > 0)
      return `No data matching the filter "${this.filter}"`;
    else
      return "Table look sad and empty :(";
  }

  onPageIndexChangeEmit(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.onPageIndexChange.emit(event.pageIndex);
    this.multipleRowSelected.clear();
    this.onMultipleRowSelectedEmit();
  }

  getAutoManageColumns() {
    return this.displayedColumns.filter(e => !this.extraColumns.includes(e) && !this.prefixColumns.includes(e));
  }

  isAllSelected() {
    const numSelected = this.multipleRowSelected.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.multipleRowSelected.clear();
      return;
    }

    this.multipleRowSelected.select(...this.dataSource.data);
  }

  checkboxLabel(row?: T): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.multipleRowSelected.isSelected(row) ? 'deselect' : 'select'} row ${this.matRows.indexOf(row) + 1}`;
  }

  onMultipleRowSelectedEmit() {
    if(this.multipleRowSelected.hasValue()) {
      this.onMultipleRowSelected.emit(this.multipleRowSelected.selected);
    }
    else {
      this.onMultipleRowSelected.emit([]);
    }
  }
}
