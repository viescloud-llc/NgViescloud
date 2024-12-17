import { Component, Input, OnInit } from '@angular/core';
import { MatTableDisplayLabel, MatTableHide } from '../../model/Mat.model';

class customRow<T> {
  @MatTableHide()
  value?: T;
  name: string = '';
  type: string = 'path';
}

@Component({
  selector: 'app-mat-table-path',
  templateUrl: './mat-table-path.component.html',
  styleUrls: ['./mat-table-path.component.scss']
})
export class MatTablePathComponent<T> implements OnInit {

  @Input()
  value: T[] = [];

  @Input()
  getPathFn!: (e: T) => string;

  @Input()
  getLabelFn!: (e: T) => string;

  currentPath: string = '/';

  customRows: customRow<T>[] = [];
  blankRow: customRow<T> = new customRow<T>();
  
  constructor() { }
  ngOnInit(): void {
    this.parseTableRow();
  }

  checkValidPath() {
    if(!this.currentPath.startsWith('/'))
      this.currentPath = '/' + this.currentPath;

    this.parseTableRow();
  }

  parseTableRow() {
    this.customRows = [];

    if(this.currentPath.endsWith('/')) {
      this.customRows = this.getAllRowForPath(this.currentPath.substring(0, this.currentPath.length - 1));
    } else {
      this.customRows = this.getAllRowForPath(this.currentPath);
    }
      
  }

  getAllRowForPath(path: string) {
    let rows: customRow<T>[] = [];

    let filterPotentialPath = this.value.filter(e => this.getPathFn(e).startsWith(path));
    
    filterPotentialPath.forEach(e => {
      let customPath = this.getPathFn(e);
      customPath = customPath.substring(path.length).split('/')[0];

      if(rows.some(row => row.name === customPath))
        return;

      rows.push({
        name: customPath,
        type: 'path'
      });
    })

    if(path.endsWith('/') && path.split('/').length > 2)
      path = path.substring(0, path.length - 1);

    let filterValue = this.value.filter(e => this.getPathFn(e) === path);
    filterValue.forEach(e => {
      let row = new customRow<T>();
      row.value = e;
      row.name = this.getLabelFn(e);
      row.type = 'item';
      rows.push(row);
    })

    return rows;
  }
}
