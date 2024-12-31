import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatColumn, MatTableSettingType } from '../../model/Mat.model';

@Component({
  selector: 'app-mat-table',
  templateUrl: './mat-table.component.html',
  styleUrls: ['./mat-table.component.scss']
})
export class MatTableComponent<T extends object> implements OnInit, OnChanges, AfterViewInit {

  @Input()
  filterDisplay: number = 0;

  @Input()
  matRows: T[] = [];

  matColumns: MatColumn[] = [];

  @Input()
  pageSizeOptions: number[] = [5, 10, 25, 100];

  @Output()
  pageIndexChange: EventEmitter<number> = new EventEmitter<number>();

  @Input()
  showFilter: boolean = false;

  @Input()
  showPagination: boolean = false;

  @Input()
  initSort?: {key: string, order: 'asc' | 'desc' };

  @Output()
  onEditRow: EventEmitter<T> = new EventEmitter();

  displayedColumns: string[] = [];

  dataSource = new MatTableDataSource(this.matRows);

  filter?: string;

  @ViewChild(MatPaginator)
  paginator!: MatPaginator;

  @ViewChild(MatSort)
  sort!: MatSort;

  @Input()
  blankObject?: any;

  @Input()
  showMatTooltip: boolean = false;

  constructor(
    private cd: ChangeDetectorRef
  ) { }

  ngAfterViewInit(): void {
    if(this.initSort) {
      this.sort.active = this.initSort.key;
      this.sort.direction = this.initSort.order;
    }
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
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['matRows']) {
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
        })
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
    if (this.matRows.length > 0) {
      let index = 0;
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
    if (this.matColumns) {
      this.matColumns = this.matColumns.sort((a, b) => a.index - b.index);
      this.matColumns.forEach(e => {
        this.displayedColumns.push(e.key);
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

  editRow(row: T) {
    this.onEditRow.emit(row);
  }

  getColumnSetting(label: string): MatColumn {
    let index = 0;
    let matColumn: MatColumn;
    this.displayedColumns.forEach(e => {
      if (e === label) {
        matColumn = this.matColumns[index];
        return;
      }
      index++;
    })

    return matColumn!;
  }

  getLabel(label: string): string {
    let matColumn = this.getColumnSetting(label);
    if (matColumn.label)
      return matColumn.label;
    else
      return label;
  }

  getFilterWarning() {
    if(this.matRows.length <= 0)
      return "Table look sad and empty :(";
    else
      return `No data matching the filter "${this.filter}"`;
  }
}
