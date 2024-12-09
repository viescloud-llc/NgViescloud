import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RouteChangeSubcribe } from 'projects/viescloud-utils/src/lib/directive/RouteChangeSubcribe.directive';
import { MonacoLanguage } from 'projects/viescloud-utils/src/lib/model/MonacoEditor.model';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { RouteUtil } from 'projects/viescloud-utils/src/lib/util/Route.utils';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { FsWriteMode } from '../model/ensible.model';
import { EnsibleFsService } from '../service/ensible-fs/ensible-fs.service';
import { EnsibleWorkspaceParserService } from '../service/ensible-workspace/ensible-workspace.service';
import { EnsibleVaultService } from '../service/ensible-vault/ensible-vault.service';
import { EnsibleWorkSpace } from '../model/ensible.parser.model';

@Component({
  selector: 'app-ensible-fs',
  templateUrl: './ensible-fs.component.html',
  styleUrls: ['./ensible-fs.component.scss']
})
export class EnsibleFsComponent extends RouteChangeSubcribe {
  fullSortedPath: string = '';
  parentName: string = '';
  error: string = '';

  fileName: string = '';
  fileNameCopy: string = '';
  fileContent: string = '';
  fileContentCopy: string = '';

  easyMode: boolean = false;
  newFile: boolean = false;

  //secrets
  vaultDectypt = '';
  vaultDectyptWithPassword = true;
  vaultDectypted = false;

  //Data
  ws?: EnsibleWorkSpace;

  constructor(
    private ensibleFsService: EnsibleFsService,
    public ensibleWorkspaceParserService: EnsibleWorkspaceParserService,
    private ensibleVaultService: EnsibleVaultService,
    private rxJSUtils: RxJSUtils,
    private dialogUtils: DialogUtils,
    private router: Router,
    route: ActivatedRoute,
  ) {
    super(route);
  }

  cleanAllValue() {
    this.fullSortedPath = '';
    this.parentName = '';
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
    if(pathSplits.length == 5) {
      this.parentName = pathSplits[pathSplits.length - 2];
      this.fileName = pathSplits[pathSplits.length - 1];
      this.fileNameCopy = structuredClone(this.fileName);
      this.fullSortedPath = `/${this.parentName}/${this.fileName}`;

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
      this.fullSortedPath = `/${this.parentName}/${this.fileName}`;
      this.fileNameCopy = structuredClone(this.fileName);
    }

    if(DataUtils.isNotEqual(this.fileContent, this.fileContentCopy)) {
      this.ensibleFsService.writeFile(this.fullSortedPath, this.fileContent, FsWriteMode.OVERRIDEN).pipe(this.rxJSUtils.waitLoadingDialog()).subscribe({
        next: () => {
          this.fileContentCopy = structuredClone(this.fileContent);

          if(this.newFile) {
            this.ensibleWorkspaceParserService.triggerFetchWorkspace();
            this.newFile = false;
            this.router.navigate([this.parentName, this.fileName]);
          }

        },
        error: (err) => {
          this.dialogUtils.openErrorMessageFromError(err);
        }
      })
    }

    if(DataUtils.isNotEqual(this.fileName, this.fileNameCopy)) {
      this.ensibleFsService.moveFile(this.fullSortedPath, `/${this.parentName}/${this.fileName}`, FsWriteMode.OVERRIDEN).pipe(this.rxJSUtils.waitLoadingDialog()).subscribe({
        next: () => {
          this.fileNameCopy = structuredClone(this.fileName);
          this.ensibleWorkspaceParserService.triggerFetchWorkspace();
          this.router.navigate([this.parentName, this.fileName]);
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

  getLanguageType() {
    let extension = this.fileName.substring(this.fileName.lastIndexOf('.') + 1);
    return MonacoLanguage.from(extension);
  }

  decryptFileContent() {
    this.ensibleVaultService.viewVault(this.fullSortedPath, !this.vaultDectyptWithPassword ? this.vaultDectypt : undefined, this.vaultDectyptWithPassword ? this.vaultDectypt : undefined).pipe(this.rxJSUtils.waitLoadingDialog()).subscribe({
      next: data => {
        this.fileContent = data;
        this.fileContentCopy = structuredClone(data);
        this.vaultDectypted = true;
      },
      error: (err) => {
        this.dialogUtils.openErrorMessage("Error", "can't decrypt file");
      }
    })
  }
}
