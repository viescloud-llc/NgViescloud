import { Component, OnInit } from '@angular/core';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/Mat.model';
import { WrapWorkspace } from 'projects/viescloud-utils/src/lib/model/Wrap.model';
import { UtilsService } from 'projects/viescloud-utils/src/lib/service/Utils.service';
import { WrapService } from 'projects/viescloud-utils/src/lib/service/Wrap.service';

export enum Mode {
  View = 'view',
  Edit = 'edit'
}

@Component({
  selector: 'app-wrap-workspace',
  templateUrl: './wrap-workspace.component.html',
  styleUrls: ['./wrap-workspace.component.scss']
})
export class WrapWorkspaceComponent implements OnInit {

  ADD_NEW_WORKSPACE = 'Add new workspace ...';

  options: MatOption<string>[] = [];
  currentWorkspace: string = '';
  currentWorkSpaceIndex: number = -1;

  mode: Mode = Mode.View;

  constructor(public wrapService: WrapService) { }

  ngOnInit() {
    this.wrapService.init();
    this.initOptions();
  }

  initOptions() {
    this.options = [];
    this.wrapService.wrapWorkspaces.forEach(e => {
      this.options.push({
        value: e.name,
        valueLabel: e.name
      })
    })
    this.options.push(
      {
        value: this.ADD_NEW_WORKSPACE,
        valueLabel: this.ADD_NEW_WORKSPACE
      }
    )
  }

  onSelectWorkspace(name: string) {
    if(name == this.ADD_NEW_WORKSPACE) {
      let workspace: WrapWorkspace = {
        name: 'workspace ' + (this.wrapService.wrapWorkspaces.length + 1)
      }
      this.wrapService.wrapWorkspaces.push(workspace);
      this.initOptions();
      this.currentWorkspace = workspace.name;
      this.mode = Mode.Edit;
      this.currentWorkSpaceIndex = this.wrapService.wrapWorkspaces.length - 1;
    }
    else {
      this.currentWorkspace = name;
      this.currentWorkSpaceIndex = this.wrapService.wrapWorkspaces.findIndex(e => UtilsService.isEqual(e.name, name));
    }
  }

  getNoneLabel() {
    if(this.wrapService.wrapWorkspaces.length == 0)
      return 'Click here to add a workspace';
    else
      return '';
  }

}
