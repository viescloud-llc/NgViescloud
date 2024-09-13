import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { WrapWorkspace } from 'projects/viescloud-utils/src/lib/model/Wrap.model';
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

}
