import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Mode } from '../wrap-workspace.component';
import { Wrap } from 'projects/viescloud-utils/src/lib/model/Wrap.model';
import { TrackByIndex } from 'projects/viescloud-utils/src/lib/directive/TrackByIndex';

@Component({
  selector: 'app-wrap-item',
  templateUrl: './wrap-item.component.html',
  styleUrls: ['./wrap-item.component.scss']
})
export class WrapItemComponent extends TrackByIndex implements OnInit {

  @Input()
  wrap!: Wrap;

  @Output()
  wrapChange: EventEmitter<Wrap> = new EventEmitter();

  @Input()
  mode!: Mode;

  @Output()
  modeChange: EventEmitter<Mode> = new EventEmitter();

  constructor() { 
    super();
  }

  ngOnInit() {
    if(!this.wrap.children)
      this.wrap.children = [];
  }

}
