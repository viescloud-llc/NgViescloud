import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatTableDisplayLabel, MatTableHide } from '../../model/mat.model';
import { FixChangeDetection } from '../../abtract/FixChangeDetection';
import { RouteUtils } from '../../util/Route.utils';
import { FileUtils } from '../../util/File.utils';

class customRow<T> {
  @MatTableHide()
  value?: T;
  name: string = '';
  type: string = 'path';
}

@Component({
  selector: 'app-mat-table-path',
  templateUrl: './mat-table-path.component.html',
  styleUrls: ['./mat-table-path.component.scss'],
  standalone: false
})
export class MatTablePathComponent<T> extends FixChangeDetection implements OnInit, OnChanges {

  @Input()
  value: T[] = [];

  @Input()
  getPathFn!: (e: T) => string;

  @Input()
  getLabelFn!: (e: T) => string;

  @Input()
  itemLabel = 'item';

  @Input()
  savePathToParam = false;

  @Input()
  savePathToLocalStorage = false;

  @Input()
  savePathKeyName = 'path';

  @Input()
  readonlyPathInput = false;

  @Input()
  unixStyleBack = false;

  @Input()
  showMultipleRowSelection: boolean = false;

  @Output()
  onPathChange: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  onItemSelected: EventEmitter<T> = new EventEmitter<T>();

  @Output()
  onMiddleClickItem: EventEmitter<T> = new EventEmitter<T>();

  @Output()
  onMultipleRowSelected: EventEmitter<T[]> = new EventEmitter<T[]>();

  currentPath: string = '/';

  customRowsMap: Map<string, customRow<T>[]> = new Map();

  customRows: customRow<T>[] = [];
  blankRow: customRow<T> = new customRow<T>();
  pathHistory: string[] = [];
  pathType = 'path';

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['value']) {
      this.parseTableMap();
      this.parseTableRow();
    }
  }

  ngOnInit(): void {
    if(this.savePathToLocalStorage) {
      this.changeCurrentPath(FileUtils.localStorageGetItem<string>(this.savePathKeyName) ?? '/');
    }

    if(this.savePathToParam) {
      this.changeCurrentPath(RouteUtils.getDecodedQueryParam(this.savePathKeyName) ?? '/');
    }

    this.parseTableMap();
    this.parseTableRow();
    this.onPathChangeEmit(this.currentPath);
  }

  checkValidPath() {
    this.changeCurrentPath(this.formatDash(this.currentPath));

    if(this.customRowsMap.has(this.currentPath))
      this.addHistory(this.currentPath);

    this.parseTableRow();
  }

  parseTableMap() {
    this.customRowsMap.clear();

    this.value.forEach(e => {
      let path = this.getPathFn(e);
      let label = this.getLabelFn(e);

      this.addCustomRowToMap(path, {
        value: e,
        name: label,
        type: this.itemLabel
      })

      let splitPath = path.split('/');
      for(let i = 0; i < splitPath.length; i++) {
        let path = splitPath.slice(0, i + 1).join('/');

        if(splitPath[i + 1]) {
          this.addCustomRowToMap(path, {
            name: splitPath[i + 1],
            type: this.pathType
          })
        }
      }
    })
  }

  private addCustomRowToMap(path: string, row: customRow<T>) {
    path = this.formatDash(path);

    if(!this.customRowsMap.has(path))
      this.customRowsMap.set(path, []);

    if (row.type !== this.pathType) {
      row = this.increaseCounter(path, row);
    }

    if (row.name === '' || this.customRowsMap.get(path)?.some(e => e.name === row.name)) {
      return;
    }

    this.customRowsMap.get(path)?.push(row);
  }

  private increaseCounter(path: string, row: customRow<T>) {
    let count = 0;
    let tempName = row.name;
    let found = this.customRowsMap.get(path)?.some(e => e.name === tempName);
    while(found) {
      count++;
      tempName = `${row.name} (${count})`;
      found = this.customRowsMap.get(path)?.some(e => e.name === tempName);
    }

    if (count > 0)
      row.name = `${row.name} (${count})`;

    return row;
  }

  parseTableRow() {
    let newCustomRows: customRow<T>[] = [];

    let tempPath = this.currentPath;

    if(tempPath !== '/' && tempPath.endsWith('/'))
      tempPath = tempPath.substring(0, tempPath.length - 1);

    newCustomRows = this.customRowsMap.get(tempPath) ?? [];

    //if it still not have value then pop
    if(newCustomRows.length === 0) {
      let splits = tempPath.split('/');
      splits.pop();
      tempPath = splits.join('/');
      tempPath = this.formatDash(tempPath);

      newCustomRows = this.customRowsMap.get(tempPath)?.filter(e => e.type === this.pathType && this.isPartOfPath(this.currentPath, e.name)) ?? [];
    }

    if(this.unixStyleBack && this.currentPath !== '/' && !newCustomRows.some(e => e.name === '..')) {
      newCustomRows.push({
        name: '..',
        type: this.pathType
      })
    }

    this.customRows = newCustomRows;
  }

  private isPartOfPath(path: string, name: string): boolean {
    let last = path.split('/').pop() ?? '/';

    return name.includes(last);
  }

  formatDash(path: string): string {
    if(!path.startsWith('/'))
      path = '/' + path;
    return path;
  }

  selectedRow(customRow: customRow<T>) {
    if(customRow.type === this.pathType) {
      if(this.unixStyleBack && customRow.name === '..') {
        this.goBackAPath();
        return;
      }

      if(this.currentPath !== '/' && this.customRowsMap.has(this.currentPath)) {
        this.currentPath += '/' + customRow.name;
      }
      else {
        let split = this.currentPath.split('/');
        split.pop();
        this.changeCurrentPath(split.join('/') + this.formatDash(customRow.name));
      }
    } else if(customRow.type === this.itemLabel) {
      this.onItemSelected.emit(customRow.value);
    }
  }

  middleClickItem(customRow: customRow<T>) {
    if(customRow.type === this.itemLabel) {
      this.onMiddleClickItem.emit(customRow.value);
    }
  }

  goBackAPath() {
    let split = this.currentPath.split('/');
    split.pop();
    this.changeCurrentPath(split.join('/'));
  }

  goBack() {
    if(this.pathHistory.length === 0) {
      this.goBackAPath();
      return;
    }

    while(this.pathHistory[this.pathHistory.length - 1] === this.currentPath) {
      this.pathHistory.pop();
    }

    this.changeCurrentPath(this.pathHistory.pop() ?? '/');
  }

  async addHistory(path: string) {
    if(this.pathHistory[this.pathHistory.length - 1] !== path) {
      this.pathHistory.push(path);

      if(this.savePathToLocalStorage)
        FileUtils.localStorageSetItem(this.savePathKeyName, path);

      if(this.savePathToParam)
        RouteUtils.setQueryParam(this.savePathKeyName, path);

      this.onPathChangeEmit(path);
    }
  }

  changeCurrentPath(path: string) {
    this.currentPath = path;
    this.onPathChangeEmit(path);
  }

  onPathChangeEmit(path: string) {
    this.onPathChange.emit(path);
  }

  onMultipleRowSelectedEmit(elements: customRow<T>[]) {
    this.onMultipleRowSelected.emit(elements.filter(e => e.type !== this.pathType && e.value).map(e => e.value!));
  }
}
