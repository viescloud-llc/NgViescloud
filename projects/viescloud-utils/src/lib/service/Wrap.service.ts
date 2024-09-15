import { Injectable } from '@angular/core';
import { WrapWorkspace } from '../model/Wrap.model';
import { S3StorageServiceV1 } from './ObjectStorageManager.service';
import { UtilsService, VFile } from './Utils.service';
import { MatDialog } from '@angular/material/dialog';

@Injectable({
  providedIn: 'root'
})
export class WrapService {

  private WRAP_WORKSPACE: string = 'wrap/WrapWorkspace.json';

  wrapWorkspaces: WrapWorkspace[] = [];
  wrapWorkspacesCopy: WrapWorkspace[] = [];

  constructor(
    private s3StorageServiceV1: S3StorageServiceV1,
    private matDialog: MatDialog
  ) {}

  init(): Promise<void> {
    return new Promise((resolve, reject) => {
      let workspacesLocal = UtilsService.localStorageGetItem<WrapWorkspace[]>(this.WRAP_WORKSPACE);
      if(workspacesLocal) {
        this.setWorkspaces(workspacesLocal);
        resolve();
      }
      else {
        this.s3StorageServiceV1.getFileByFileName(this.WRAP_WORKSPACE).pipe(UtilsService.waitLoadingDialog(this.matDialog)).subscribe({
          next: (data) => {
            UtilsService.readBlobAsText(data).then((data) => {
              this.setWorkspaces(JSON.parse(data));
              this.saveThisWorkspacesLocally();
              resolve();
            })
          },
          error: (error) => {
            reject();
          }
        })
      }
    })
  }

  private setWorkspaces(workspacesLocal: WrapWorkspace[]) {
    this.wrapWorkspaces = workspacesLocal;
    this.wrapWorkspacesCopy = structuredClone(this.wrapWorkspaces);
  }

  saveWorkSpaces(workspaces: WrapWorkspace[]) {
    this.saveWorkspacesLocally(workspaces);

    let vfile: VFile = {
      name: this.WRAP_WORKSPACE,
      type: 'text',
      extension: 'json',
      rawFile: new Blob([JSON.stringify(workspaces)], {type: 'application/json'}),
      value: JSON.stringify(workspaces)
    }
    
    this.s3StorageServiceV1.getFileMetadataByFileName(this.WRAP_WORKSPACE).pipe(UtilsService.waitLoadingDialog(this.matDialog)).subscribe({
      next: (data) => {
        this.s3StorageServiceV1.putFileByFileName(this.WRAP_WORKSPACE, vfile, false).pipe(UtilsService.waitLoadingDialog(this.matDialog)).subscribe({
          next: (data) => {
            this.init();
          }
        })
      },
      error: (error) => {
        this.s3StorageServiceV1.postFile(vfile, false).pipe(UtilsService.waitLoadingDialog(this.matDialog)).subscribe({
          next: (data) => {
            this.init();
          }
        })
      }
    })
  }

  saveWorkspacesLocally(workspaces: WrapWorkspace[]) {
    UtilsService.localStorageSetItem(this.WRAP_WORKSPACE, workspaces);
    this.init();
  }

  saveThisWorkspaces() {
    this.saveWorkSpaces(this.wrapWorkspaces);
  }

  saveThisWorkspacesLocally() {
    this.saveWorkspacesLocally(this.wrapWorkspaces);
  }

  revert() {
    this.wrapWorkspaces = structuredClone(this.wrapWorkspacesCopy);
  }

  isValueChange(): boolean {
    return !UtilsService.isEqual(this.wrapWorkspaces, this.wrapWorkspacesCopy);
  }
}
