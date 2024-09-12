import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { WrapWorkspace } from 'projects/viescloud-utils/src/lib/model/Wrap.model';
import { Mode } from '../wrap-workspace.component';

@Component({
  selector: 'app-wrap',
  templateUrl: './wrap.component.html',
  styleUrls: ['./wrap.component.scss']
})
export class WrapComponent implements OnInit {

  @Input()
  wrapWorkspace!: WrapWorkspace;

  @Output()
  wrapWorkspaceChange: EventEmitter<WrapWorkspace> = new EventEmitter();

  @Input()
  mode!: Mode

  @Output()
  modeChange: EventEmitter<Mode> = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

}
