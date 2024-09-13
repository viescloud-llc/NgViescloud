import { Injectable } from '@angular/core';
import { WrapWorkspace } from '../model/Wrap.model';
import { S3StorageServiceV1 } from './ObjectStorageManager.service';
import { UtilsService, VFile } from './Utils.service';

@Injectable({
  providedIn: 'root'
})
export class WrapService {

  private WRAP_WORKSPACE: string = '/wrap/WrapWorkspace.json';

  wrapWorkspaces: WrapWorkspace[] = [];
  wrapWorkspacesCopy: WrapWorkspace[] = [];

  constructor(private s3StorageServiceV1: S3StorageServiceV1) {}

  init() {
    let workspacesLocal = UtilsService.localStorageGetItem<WrapWorkspace[]>(this.WRAP_WORKSPACE);
    if(workspacesLocal) {
      this.wrapWorkspaces = workspacesLocal;
      this.wrapWorkspacesCopy = structuredClone(this.wrapWorkspaces);
    }
    else {
      this.s3StorageServiceV1.getFileByFileName(this.WRAP_WORKSPACE).subscribe({
        next: (data) => {
          UtilsService.readBlobAsText(data).then((data) => {
            this.wrapWorkspaces = JSON.parse(data);
            this.wrapWorkspacesCopy = structuredClone(this.wrapWorkspaces);
          })
        }
      })
    }
  }

  saveWorkSpaces(workspaces: WrapWorkspace[]) {
    this.saveWorkspacesLocally(workspaces);
    this.s3StorageServiceV1.deleteFileByFileName(this.WRAP_WORKSPACE).subscribe({
      next: (data) => {
        let vfile: VFile = {
          name: this.WRAP_WORKSPACE,
          type: 'text',
          extension: 'json',
          value: JSON.stringify(workspaces)
        }
        this.s3StorageServiceV1.postFile(vfile, false).subscribe({
          next: (data) => {
            this.init();
          }
        })
      }
    })
  }

  saveWorkspacesLocally(workspaces: WrapWorkspace[]) {
    UtilsService.localStorageSetItem(this.WRAP_WORKSPACE, workspaces);
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
}
