import { NestedTreeControl } from '@angular/cdk/tree';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { Wrap, WrapWorkspace } from 'projects/viescloud-utils/src/lib/model/wrap.model';

@Component({
  selector: 'app-wrap-tree',
  templateUrl: './wrap-tree.component.html',
  styleUrls: ['./wrap-tree.component.scss']
})
export class WrapTreeComponent implements OnInit, OnChanges {

  @Input()
  wraps!: Wrap[];

  @Input() 
  expandAll: boolean | null = null; // New input to control expand/collapse for all nodes

  @Output()
  wrapsChange: EventEmitter<Wrap[]> = new EventEmitter();

  // Track the visibility of children for each wrap
  isExpanded: { [title: string]: boolean } = {};

  @Input()
  wrapWorkspace!: WrapWorkspace;

  @Output()
  wrapWorkspaceChange: EventEmitter<WrapWorkspace> = new EventEmitter();

  constructor() { 
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['expandAll'] && changes['expandAll'].currentValue !== null) {
      // Apply the expand/collapse state to all nodes
      this.toggleAllChildren(this.wraps, changes['expandAll'].currentValue);
    }
  }

  ngOnInit() {
    if(!this.wraps)
      this.wraps = this.wrapWorkspace.wraps;
  }

  // Recursively toggle children visibility
  toggleAllChildren(wraps: Wrap[], expand: boolean): void {
    wraps.forEach((wrap) => {
      this.isExpanded[wrap.title] = expand;
      if (wrap.children?.length) {
        this.toggleAllChildren(wrap.children, expand);
      }
    });
  }

  // Method to toggle the visibility of the children
  toggleChildren(wrap: Wrap): void {
    this.isExpanded[wrap.title] = !this.isExpanded[wrap.title];
  }

  // Check if a wrap's children are expanded
  isChildrenVisible(wrap: Wrap): boolean {
    return this.isExpanded[wrap.title];
  }
}
