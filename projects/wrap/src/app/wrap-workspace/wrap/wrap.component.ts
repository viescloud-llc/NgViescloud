import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Wrap, WrapWorkspace } from 'projects/viescloud-utils/src/lib/model/Wrap.model';
import { Mode } from '../wrap-workspace.component';
import { TrackByIndex } from 'projects/viescloud-utils/src/lib/directive/TrackByIndex';

@Component({
  selector: 'app-wrap',
  templateUrl: './wrap.component.html',
  styleUrls: ['./wrap.component.scss']
})
export class WrapComponent extends TrackByIndex implements OnInit {

  @Input()
  wrapWorkspace!: WrapWorkspace;

  @Output()
  wrapWorkspaceChange: EventEmitter<WrapWorkspace> = new EventEmitter();

  @Input()
  mode!: Mode

  @Output()
  modeChange: EventEmitter<Mode> = new EventEmitter();

  constructor() {
    super();
  }

  ngOnInit() {
  }

  moveLeft(index: number) {
    let toIndex = index - 1;
    if(toIndex < 0)
      toIndex = this.wrapWorkspace.wraps.length - 1;
    this.swap(index, toIndex);
  }

  moveRight(index: number) {
    let toIndex = index + 1;
    if(toIndex > this.wrapWorkspace.wraps.length - 1)
      toIndex = 0;
    this.swap(index, toIndex);
  }

  swap(fromIndex: number, toIndex: number) {
    if(toIndex < 0 || toIndex >= this.wrapWorkspace.wraps.length)
      return;
    
    let temp = this.wrapWorkspace.wraps[fromIndex];
    this.wrapWorkspace.wraps[fromIndex] = this.wrapWorkspace.wraps[toIndex];
    this.wrapWorkspace.wraps[toIndex] = temp;
  }

}
