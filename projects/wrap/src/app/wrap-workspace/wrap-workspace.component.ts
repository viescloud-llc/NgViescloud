import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'projects/environments/environment.prod';
import { ConfirmDialog } from 'projects/viescloud-utils/src/lib/dialog/confirm-dialog/confirm-dialog.component';
import { InputDialog } from 'projects/viescloud-utils/src/lib/dialog/input-dialog/input-dialog.component';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/Mat.model';
import { WrapWorkspace } from 'projects/viescloud-utils/src/lib/model/Wrap.model';
import { AuthenticatorService } from 'projects/viescloud-utils/src/lib/service/Authenticator.service';
import { S3StorageServiceV1 } from 'projects/viescloud-utils/src/lib/service/ObjectStorageManager.service';
import { SettingService } from 'projects/viescloud-utils/src/lib/service/Setting.service';
import { UtilsService } from 'projects/viescloud-utils/src/lib/service/Utils.service';
import { WrapService } from 'projects/viescloud-utils/src/lib/service/Wrap.service';

export enum WrapMode {
  VIEW = 'view',
  EDIT = 'edit',
  TREE = 'tree',
  JSON = 'json'
}

@Component({
  selector: 'app-wrap-workspace',
  templateUrl: './wrap-workspace.component.html',
  styleUrls: ['./wrap-workspace.component.scss']
})
export class WrapWorkspaceComponent implements OnInit, OnDestroy {

  Mode = WrapMode;
  DEFAULT_WRAP_PREFIX = 'wrap/';
  ADD_NEW_WORKSPACE = 'Add new workspace ...';
  WORKSPACE_QUERY_PARAM = 'workspace';

  options: MatOption<string>[] = [];
  currentWorkspace: string = '';
  currentWorkSpaceIndex: number = -1;

  mode: WrapMode = WrapMode.VIEW;
  modeOptions: MatOption<any>[] = UtilsService.getEnumMatOptions(WrapMode);

  expandAllTree: boolean | null = null;

  constructor(
    public wrapService: WrapService,
    private matDialog: MatDialog,
    public authenticatorService: AuthenticatorService,
    private settingService: SettingService,
    private utilService: UtilsService,
    private s3StorageService: S3StorageServiceV1,
    private snackBar: MatSnackBar
  ) { }
  ngOnDestroy(): void {
    this.loadBackgroundImage('');
  }

  async ngOnInit() {
    await this.wrapService.init().catch(e => {});

    this.initOptions();
    if(this.wrapService.wrapWorkspaces.length > 0) {
      let index = Number.parseInt(UtilsService.getQueryParam(this.WORKSPACE_QUERY_PARAM) || '0');
      if(index < 0 && index >= this.wrapService.wrapWorkspaces.length)
        index = 0;
      this.currentWorkspace = this.wrapService.wrapWorkspaces[index].name;
      this.currentWorkSpaceIndex = index;
      this.loadBackgroundImage(this.wrapService.wrapWorkspaces[index].backgroundPicture);
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

  async onSelectWorkspace(name: string) {
    if(name == this.ADD_NEW_WORKSPACE) {
      let workspace: WrapWorkspace = new WrapWorkspace();
      workspace.name = 'workspace ' + (this.wrapService.wrapWorkspaces.length + 1)
      this.wrapService.wrapWorkspaces.push(workspace);
      this.initOptions();
      this.currentWorkspace = workspace.name;
      this.mode = WrapMode.EDIT;
      this.currentWorkSpaceIndex = this.wrapService.wrapWorkspaces.length - 1;
      UtilsService.setQueryParam(this.WORKSPACE_QUERY_PARAM, this.currentWorkSpaceIndex.toString());
    }
    else {
      this.currentWorkspace = name;
      this.currentWorkSpaceIndex = this.wrapService.wrapWorkspaces.findIndex(e => UtilsService.isEqual(e.name, name));
      UtilsService.setQueryParam(this.WORKSPACE_QUERY_PARAM, this.currentWorkSpaceIndex.toString());
    }

    this.loadBackgroundImage(this.wrapService.wrapWorkspaces[this.currentWorkSpaceIndex].backgroundPicture);
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

    if(mode === WrapMode.VIEW && this.wrapService.isValueChange()) {
      let dialog = this.matDialog.open(ConfirmDialog, {data: {title: 'Save?', message: 'Are you sure you want to change mode to view?\nNote: It will not be saved to server. Therefore, it will be lost if you close the window.', yes: 'OK', no: 'Cancel'}, width: '100%'});
  
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
        input: this.wrapService.wrapWorkspaces[this.currentWorkSpaceIndex].backgroundPicture
      },
      width: '100%'
    })

    dialog.afterClosed().subscribe({
      next: res => {
        if(res) {
          this.wrapService.wrapWorkspaces[this.currentWorkSpaceIndex].backgroundPicture = res;
          this.loadBackgroundImage(res);
        }
      }
    })
  }

  async uploadBackgroundImage() {
    let vfile = await this.utilService.uploadFile('image/*');

    if(vfile) {
      vfile.name = this.DEFAULT_WRAP_PREFIX + this.currentWorkspace + '.' + vfile.extension;
      let url = await this.s3StorageService.putOrPostFileAndGetViescloudUrl(vfile, false, this.matDialog);
      this.wrapService.wrapWorkspaces[this.currentWorkSpaceIndex].backgroundPicture = url;
      this.s3StorageService.objectUrlCache.delete(url);
      this.loadBackgroundImage(url);
    }
  }

  loadBackgroundImage(url: string) {
    if(url.includes(environment.gateway_api)) {
      this.s3StorageService.generateObjectUrlFromViescloudUrl(url, undefined, this.snackBar).then(res => {
        this.settingService.backgroundImageUrl = res;
      })
    } 
    else {
      this.settingService.backgroundImageUrl = url;
    }
  }

  changeWorkspaceName() {
    let dialog = this.matDialog.open(InputDialog, {
      data: {
        title: 'Change Workspace Name',
        label: 'Workspace Name',
        yes: 'OK',
        no: 'Cancel',
        input: this.wrapService.wrapWorkspaces[this.currentWorkSpaceIndex].name
      },
      width: '100%'
    })

    dialog.afterClosed().subscribe({
      next: res => {
        if(res) {
          this.wrapService.wrapWorkspaces[this.currentWorkSpaceIndex].name = res;
          this.initOptions();
          this.currentWorkspace = res;
        }
      }
    })
  }

  reSync() {
    let dialog = this.matDialog.open(ConfirmDialog, {
      data: {
        message: 'Are you sure you want to re-sync?\nNote: All your changes locally will be lost.',
        title: 'Re-sync',
        yes: 'Re-sync',
        no: 'Cancel'
      },
      width: '100%'
    })

    dialog.afterClosed().subscribe({
      next: res => {
        if(res) {
          this.wrapService.reSync();
        }
      }
    })
  }

  changeWorkspaceCorsProxyUrl() {
    let dialog = this.matDialog.open(InputDialog, {
      data: {
        title: 'Change Workspace CORS Proxy URL',
        label: 'CORS Proxy URL',
        yes: 'OK',
        no: 'Cancel',
        input: this.wrapService.wrapWorkspaces[this.currentWorkSpaceIndex].corsProxyUrl,
        placeholder: 'e.g https://cors-anywhere.herokuapp.com/'
      },
      width: '100%'
    })

    dialog.afterClosed().subscribe({
      next: res => {
        if(res) {
          this.wrapService.wrapWorkspaces[this.currentWorkSpaceIndex].corsProxyUrl = res;
        }
      }
    })
  }
}
