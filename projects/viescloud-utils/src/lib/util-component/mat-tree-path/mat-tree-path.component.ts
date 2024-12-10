import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-mat-tree-path',
  templateUrl: './mat-tree-path.component.html',
  styleUrls: ['./mat-tree-path.component.scss']
})
export class MatTreePathComponent<T> {

  @Input()
  value!: T;

  @Input()
  getPathFn!: (e: T) => string;

  @Input()
  getLabelFn!: (e: T) => string;

  currentPath: string = '';
  
  constructor() { }
}
