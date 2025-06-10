import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { WrapWorkspace } from 'projects/viescloud-utils/src/lib/model/wrap.model';

@Component({
  selector: 'app-wrap-json',
  templateUrl: './wrap-json.component.html',
  styleUrls: ['./wrap-json.component.scss']
})
export class WrapJsonComponent implements OnInit {

  @Input()
  wrapWorkspace!: WrapWorkspace;

  @Output()
  wrapWorkspaceChange: EventEmitter<WrapWorkspace> = new EventEmitter();

  constructor() { }

  ngOnInit() {

  }

  getWorkspaceAsJson() {
    return JSON.stringify(this.wrapWorkspace, null, 2);
  }

  setWorkspaceAsJson(json: string) {
    try {
      this.wrapWorkspace = JSON.parse(json);
      this.wrapWorkspaceChange.emit(this.wrapWorkspace);
    }
    catch (error) {}
  }

}
