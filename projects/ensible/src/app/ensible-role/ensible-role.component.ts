import { EnsibleWorkspaceParserService } from './../service/ensible-workspace/ensible-workspace.service';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { RxJSUtils } from './../../../../viescloud-utils/src/lib/util/RxJS.utils';
import { Component, OnInit } from '@angular/core';
import { RouteUtil } from 'projects/viescloud-utils/src/lib/util/Route.utils';
import { EnsibleFsService } from '../service/ensible-fs/ensible-fs.service';
import { ActivatedRoute, Router } from '@angular/router';
import { RouteChangeSubcribe } from 'projects/viescloud-utils/src/lib/directive/RouteChangeSubcribe.directive';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { FsWriteMode } from '../model/ensible.model';

@Component({
  selector: 'app-ensible-role',
  templateUrl: './ensible-role.component.html',
  styleUrls: ['./ensible-role.component.scss']
})
export class EnsibleRoleComponent extends RouteChangeSubcribe{

  fullSortedPath: string = '';
  roleName: string = '';
  roleCategoryName: string = '';
  fileName: string = '';
  fileNameCopy: string = '';

  error: string = '';

  fileContent: string = '';
  fileContentCopy: string = '';

  easyMode: boolean = false;

  newFile: boolean = false;

  constructor(
    private ensibleFsService: EnsibleFsService,
    private ensibleWorkspaceParserService: EnsibleWorkspaceParserService,
    private rxJSUtils: RxJSUtils,
    private dialogUtils: DialogUtils,
    private router: Router,
    route: ActivatedRoute,
  ) {
    super(route);
  }

  cleanAllValue() {
    this.fullSortedPath = '';
    this.roleName = '';
    this.roleCategoryName = '';
    this.fileName = '';
    this.fileNameCopy = '';
    this.fileContent = '';
    this.fileContentCopy = '';
    this.error = '';
    this.newFile = false;
  }

  override onRouteChange(): void {
    this.cleanAllValue();
    let pathSplits = RouteUtil.getCurrentUrl().split('/');
    if(pathSplits.length == 7) {
      this.roleName = pathSplits[pathSplits.length - 3];
      this.roleCategoryName = pathSplits[pathSplits.length - 2];
      this.fileName = pathSplits[pathSplits.length - 1];
      this.fileNameCopy = structuredClone(this.fileName);
      this.fullSortedPath = `/roles/${this.roleName}/${this.roleCategoryName}/${this.fileName}`;

      if(this.fileName === 'new') {
        this.newFile = true;
        this.fileContent = `---\n`;
        return;
      }

      this.ensibleFsService.readFileAsString(this.fullSortedPath).pipe(this.rxJSUtils.waitLoadingDialog()).subscribe({
        next: data => {
          this.fileContent = data;
          this.fileContentCopy = structuredClone(data);
        },
        error: (err) => {
          this.dialogUtils.openErrorMessageFromError(err);
        }
      });
    }
    else
      this.error = 'Invalid roles path';
  }

  isValueChange() {
    return DataUtils.isNotEqual(this.fileContent, this.fileContentCopy) || DataUtils.isNotEqual(this.fileName, this.fileNameCopy);
  }

  save() {
    if(this.fileName === 'new') {
      this.dialogUtils.openErrorMessage('File name Error', 'File name cannot be "new"');
      return;
    }

    if(this.newFile) {
      this.fullSortedPath = `/roles/${this.roleName}/${this.roleCategoryName}/${this.fileName}`;
      this.fileNameCopy = structuredClone(this.fileName);
    }

    if(DataUtils.isNotEqual(this.fileContent, this.fileContentCopy)) {
      this.ensibleFsService.writeFile(this.fullSortedPath, this.fileContent, FsWriteMode.OVERRIDEN).pipe(this.rxJSUtils.waitLoadingDialog()).subscribe({
        next: () => {
          this.fileContentCopy = structuredClone(this.fileContent);

          if(this.newFile) {
            this.ensibleWorkspaceParserService.triggerFetchWorkspace();
            this.newFile = false;
            this.router.navigate(['roles', this.roleName, this.roleCategoryName, this.fileName]);
          }

        },
        error: (err) => {
          this.dialogUtils.openErrorMessageFromError(err);
        }
      })
    }

    if(DataUtils.isNotEqual(this.fileName, this.fileNameCopy)) {
      this.ensibleFsService.moveFile(this.fullSortedPath, `/roles/${this.roleName}/${this.roleCategoryName}/${this.fileName}`, FsWriteMode.OVERRIDEN).pipe(this.rxJSUtils.waitLoadingDialog()).subscribe({
        next: () => {
          this.fileNameCopy = structuredClone(this.fileName);
          this.ensibleWorkspaceParserService.triggerFetchWorkspace();
          this.router.navigate(['roles', this.roleName, this.roleCategoryName, this.fileName]);
        },
        error: (err) => {
          this.dialogUtils.openErrorMessageFromError(err);
        }
      })
    }

  }

  revert() {
    this.fileContent = structuredClone(this.fileContentCopy);
    this.fileName = structuredClone(this.fileNameCopy);
  }
}
