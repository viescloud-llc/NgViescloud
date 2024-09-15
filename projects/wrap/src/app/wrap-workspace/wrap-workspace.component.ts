import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from 'projects/viescloud-utils/src/lib/dialog/confirm-dialog/confirm-dialog.component';
import { InputDialog } from 'projects/viescloud-utils/src/lib/dialog/input-dialog/input-dialog.component';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/Mat.model';
import { WrapWorkspace } from 'projects/viescloud-utils/src/lib/model/Wrap.model';
import { AuthenticatorService } from 'projects/viescloud-utils/src/lib/service/Authenticator.service';
import { SettingService } from 'projects/viescloud-utils/src/lib/service/Setting.service';
import { UtilsService } from 'projects/viescloud-utils/src/lib/service/Utils.service';
import { WrapService } from 'projects/viescloud-utils/src/lib/service/Wrap.service';

export enum Mode {
  View = 'view',
  Edit = 'edit',
  TREE = 'tree',
  JSON = 'json'
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
  modeOptions: MatOption<any>[] = UtilsService.getEnumMatOptions(Mode);

  expandAllTree: boolean | null = null;

  constructor(
    public wrapService: WrapService,
    private matDialog: MatDialog,
    public authenticatorService: AuthenticatorService,
    private settingService: SettingService
  ) { }

  async ngOnInit() {
    await this.wrapService.init();
    this.initOptions();
    if(this.wrapService.wrapWorkspaces.length > 0) {
      this.currentWorkspace = this.wrapService.wrapWorkspaces[0].name;
      this.currentWorkSpaceIndex = 0;
      this.settingService.backgroundImageUrl = this.wrapService.wrapWorkspaces[0].backgroundPicture;
    }
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

  removeThisWorkspace() {
    let dialog = this.matDialog.open(ConfirmDialog, {
      data: {
        message: 'Are you sure you want to delete this workspace?',
        title: 'Delete workspace',
        ok: 'Delete',
        cancel: 'Cancel'
      }
    })

    dialog.afterClosed().subscribe(result => {
      if(result) {
        this.wrapService.wrapWorkspaces.splice(this.currentWorkSpaceIndex, 1);
        this.initOptions();
        if(this.wrapService.wrapWorkspaces.length > 0) {
          this.currentWorkspace = this.wrapService.wrapWorkspaces[0].name;
          this.currentWorkSpaceIndex = 0;
        }
        else {
          this.currentWorkspace = '';
          this.currentWorkSpaceIndex = -1;
        }
      }
    })
  }

  onSelectWorkspace(name: string) {
    if(name == this.ADD_NEW_WORKSPACE) {
      let workspace: WrapWorkspace = new WrapWorkspace();
      workspace.name = 'workspace ' + (this.wrapService.wrapWorkspaces.length + 1)
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

    this.settingService.backgroundImageUrl = this.wrapService.wrapWorkspaces[this.currentWorkSpaceIndex].backgroundPicture;
  }

  getNoneLabel() {
    if(this.wrapService.wrapWorkspaces.length == 0)
      return 'Click here to add a workspace';
    else
      return '';
  }

  saveLocally() {
    let dialog = this.matDialog.open(ConfirmDialog, {data: {title: 'Save locally?', message: 'Are you sure you want to save this workspace locally?\nThis will only save to your browser storage', yes: 'save', no: 'cancel'}, width: '100%'});
  
    dialog.afterClosed().subscribe({
      next: res => {
        if(res) {
          this.wrapService.saveThisWorkspacesLocally();
        }
      }
    })
  }

  saveToServer() {
    this.wrapService.saveThisWorkspaces();
  }

  onSelectMode(mode: any) {
    let tempMode = this.mode;
    this.mode = mode;

    if(mode === Mode.View && this.wrapService.isValueChange()) {
      let dialog = this.matDialog.open(ConfirmDialog, {data: {title: 'Save?', message: 'Are you sure you want to change mode to view?\nNote: Workspace is not yet saved', yes: 'OK', no: 'Cancel'}, width: '100%'});
  
      dialog.afterClosed().subscribe({
        next: res => {
          if(res)
            this.mode = mode;
          else
            this.mode = tempMode;
        }
      })
    }
  }

  toggleExpandAllTree(): void {
    this.expandAllTree = this.expandAllTree === null || this.expandAllTree === false ? true : false;
  }

  changeBackgroundUrl() {
    let dialog = this.matDialog.open(InputDialog, {
      data: {
        title: 'Change Background Image URL',
        label: 'Background Image URL',
        yes: 'OK',
        no: 'Cancel',
        input: this.settingService.backgroundImageUrl
      },
      width: '100%'
    })

    dialog.afterClosed().subscribe({
      next: res => {
        if(res) {
          this.wrapService.wrapWorkspaces[this.currentWorkSpaceIndex].backgroundPicture = res;
          this.settingService.backgroundImageUrl = res;
        }
      }
    })
  }
}
