import { AfterContentChecked, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RouteChangeSubcribe } from 'projects/viescloud-utils/src/lib/directive/RouteChangeSubcribe.directive';
import { MonacoLanguage } from 'projects/viescloud-utils/src/lib/model/MonacoEditor.model';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { RouteUtils } from 'projects/viescloud-utils/src/lib/util/Route.utils';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { FsWriteMode } from '../model/ensible.model';
import { EnsibleFsService } from '../service/ensible-fs/ensible-fs.service';
import { EnsibleWorkspaceParserService } from '../service/ensible-workspace/ensible-workspace.service';
import { EnsibleVaultService } from '../service/ensible-vault/ensible-vault.service';
import { EnsibleWorkSpace } from '../model/ensible.parser.model';
import { CodeEditorComponent } from 'projects/viescloud-utils/src/lib/util-component/code-editor/code-editor.component';
import { CanDeactivateGuard, ComponentCanDeactivate } from 'projects/viescloud-utils/src/lib/guards/auth.guard';
import { Observable } from 'rxjs';

enum FileType {
  INVENTORY = 'inventory',
  PLAYBOOK = 'playbooks',
  ROLE = 'roles',
  SECRET = 'secrets',
  PASSWORD = 'passwords',
  UNKOWN = 'unknown'
}

@Component({
  selector: 'app-ensible-fs',
  templateUrl: './ensible-fs.component.html',
  styleUrls: ['./ensible-fs.component.scss']
})
export class EnsibleFsComponent extends RouteChangeSubcribe implements OnChanges, AfterContentChecked, ComponentCanDeactivate {

  private prefixPath: string = '/file';

  @Input()
  fsPath: string = ''; //manually input path

  @Output()
  isEditing: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Input()
  extraToolbarButton: {uuid: string, label: string, icon?: string}[] = [];

  @Output()
  onExtraToolbarButtonClick = new EventEmitter<{uuid: string, label: string, icon?: string}>();

  layers: string[] = [];
  fileName: string = ''; //layer0
  fileNameCopy: string = '';

  fileContent: string = '';
  fileContentCopy: string = '';

  easyMode: boolean = false;
  newFile: boolean = false;
  error: string = '';

  //secrets
  vaultSecret = '';
  vaultCrtyptionWithPassword = false;
  vaultDectypted = false;

  //Data
  ws?: EnsibleWorkSpace;
  validForm: boolean = false;

  fileType = FileType.UNKOWN;

  FileType = FileType;

  @ViewChild('codeEditor')
  codeEditor?: CodeEditorComponent;

  constructor(
    private ensibleFsService: EnsibleFsService,
    public ensibleWorkspaceParserService: EnsibleWorkspaceParserService,
    private ensibleVaultService: EnsibleVaultService,
    private rxJSUtils: RxJSUtils,
    private dialogUtils: DialogUtils,
    private router: Router,
    private cd: ChangeDetectorRef,
    route: ActivatedRoute,
  ) {
    super(route);
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    return CanDeactivateGuard.canDeactivateDialog(this.isValueChange(), this.dialogUtils.matDialog);
  }

  ngAfterContentChecked(): void {
    this.cd.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['fsPath']) {
      this.onRouteChange();
    }
  }

  cleanAllValue() {
    this.layers = [];
    this.fileName = '';
    this.fileNameCopy = '';
    this.fileContent = '';
    this.fileContentCopy = '';
    this.error = '';
    this.newFile = false;
    this.vaultDectypted = false;
    this.fileType = FileType.UNKOWN;
  }

  override async onRouteChange() {
    this.cleanAllValue();

    if(this.fsPath)
      this.fsPath = RouteUtils.formatValidUrlPath(this.fsPath);

    this.layers = this.fsPath ? this.fsPath.split('/') : RouteUtils.getCurrentPath().split('/').splice(2);

    if(this.layers.length < 2) {
      this.error = 'Invalid fs path';
    }

    this.fileName = this.getLayerReverse(0);
    this.fileNameCopy = structuredClone(this.fileName);

    switch(this.getLayerReverse(1)) {
      case 'inventory':
        this.fileType = FileType.INVENTORY;
        break;
      case 'playbooks':
        this.fileType = FileType.PLAYBOOK;
        break;
      case 'roles':
        this.fileType = FileType.ROLE;
        break;
      case 'secrets':
        this.fileType = FileType.SECRET;
        break;
      case 'passwords':
        this.fileType = FileType.PASSWORD;
        break;
      default:
        this.fileType = FileType.UNKOWN;
        break;
    }

    if(this.fileName === 'new') {
      this.newFile = true;
      this.vaultDectypted = true;
      this.fileName = '';
      this.fileContent = `---\n`;
      return;
    }

    this.ensibleFsService.readFileAsString(this.getFullPath()).pipe(this.rxJSUtils.waitLoadingDialog()).subscribe({
      next: data => {
        this.fileContent = data;
        this.fileContentCopy = structuredClone(data);
      },
      error: (err) => {
        this.error = "Error when reading file or invalid file";
      }
    });

  }

  /**
   * Constructs the full path by joining the layers with an optional file name.
   * @param name - Optional file name to append to the path. If provided, the last layer is temporarily removed before appending the name.
   * @returns The full path as a string. If a name is provided, it is appended to the path after removing the last layer.
   */
  getFullPath(name?: string) {
    if(!name) {
      return RouteUtils.formatValidUrlPath(this.layers.join('/'));
    } else {
      let tempLayers = structuredClone(this.layers);
      tempLayers.pop()
      return RouteUtils.formatValidUrlPath(tempLayers.join('/') + '/' + name);
    }
  }

  getFullPathBy(newFile: boolean) {
    if(newFile) {
      return this.getFullPath(this.fileName);
    }
    else
      return this.getFullPath();
  }

  getLayerReverse(layer: number) {
    return this.layers[this.layers.length - 1 - layer];
  }

  isValueChange() {
    let change = DataUtils.isNotEqual(this.fileContent, this.fileContentCopy) || DataUtils.isNotEqual(this.fileName, this.fileNameCopy);
    this.isEditing.emit(change);
    return change;
  }

  save() {
    if(this.fileName === 'new' || !this.fileName) {
      this.dialogUtils.openErrorMessage('File name Error', 'File name cannot be "new"');
      return;
    }

    if(this.newFile) {
      this.fileNameCopy = structuredClone(this.fileName);
    }

    if(DataUtils.isNotEqual(this.fileContent, this.fileContentCopy)) {
      this.ensibleFsService.writeFile(this.getFullPathBy(this.newFile), this.fileContent, FsWriteMode.OVERRIDEN).pipe(this.rxJSUtils.waitLoadingDialog()).subscribe({
        next: () => {
          this.fileContentCopy = structuredClone(this.fileContent);

          if(this.newFile) {
            this.ensibleWorkspaceParserService.triggerFetchWorkspace();
            this.router.navigate([this.prefixPath + this.getFullPathBy(this.newFile)]);
          }

        },
        error: (err) => {
          this.dialogUtils.openErrorMessageFromError(err);
        }
      })
    }

    this.saveNameChange();
  }

  private saveNameChange() {
    if (DataUtils.isNotEqual(this.fileName, this.fileNameCopy)) {
      this.ensibleFsService.moveFile(this.getFullPath(), this.getFullPath(this.fileName), FsWriteMode.OVERRIDEN).pipe(this.rxJSUtils.waitLoadingDialog()).subscribe({
        next: () => {
          this.fileNameCopy = structuredClone(this.fileName);
          this.ensibleWorkspaceParserService.triggerFetchWorkspace();
          this.router.navigate([this.prefixPath + this.getFullPath(this.fileName)]);
        },
        error: (err) => {
          this.dialogUtils.openErrorMessageFromError(err);
        }
      });
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

  async deleteFile() {
    let confirm = await this.dialogUtils.openConfirmDialog("Delete", "Are you sure you want to delete this file?\nThis cannot be undone", "Yes", "No");
    if(confirm) {
      this.ensibleFsService.deleteFile(this.getFullPath()).pipe(this.rxJSUtils.waitLoadingDialog()).subscribe({
        next: () => {
          this.ensibleWorkspaceParserService.triggerFetchWorkspace();
          this.router.navigate(['home']);
        },
        error: (err) => {
          this.dialogUtils.openErrorMessage("Error", "Error when deleting file");
        }
      });
    }
  }

  forceResizeEditor() {
    this.codeEditor?.resizeEditor();
  }

  //-----------------------------secrets--------------------------------------

  getVaultTypeLabel() {
    return this.newFile ? 'Encrypt' : 'Decrypt';
  }

  isSecretFile() {
    return this.fileType === FileType.SECRET;
  }

  decryptFileContent() {
    this.ensibleVaultService.viewVault(this.getFullPath(), !this.vaultCrtyptionWithPassword ? this.vaultSecret : undefined, this.vaultCrtyptionWithPassword ? this.vaultSecret : undefined).pipe(this.rxJSUtils.waitLoadingDialog()).subscribe({
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

  saveSecrets() {
    if(this.fileName === 'new' || !this.fileName) {
      this.dialogUtils.openErrorMessage('File name Error', 'File name cannot be "new"');
      return;
    }

    if(this.newFile) {
      this.fileNameCopy = structuredClone(this.fileName);
    }

    if(DataUtils.isNotEqual(this.fileContent, this.fileContentCopy)) {
      if(this.newFile) {
        this.ensibleVaultService.createVault(this.fileContent, this.getFullPathBy(this.newFile), !this.vaultCrtyptionWithPassword ? this.vaultSecret : undefined, this.vaultCrtyptionWithPassword ? this.vaultSecret : undefined).pipe(this.rxJSUtils.waitLoadingDialog()).subscribe({
          next: res => {
            this.ensibleWorkspaceParserService.triggerFetchWorkspace();
            this.router.navigate([this.prefixPath + this.getFullPathBy(this.newFile)]);
            this.onRouteChange();
          },
          error: (err) => {
            this.dialogUtils.openErrorMessage("Error", "Error when creating new vault");
          }
        });
      }
      else {
        this.ensibleVaultService.modifyVault(this.fileContent, this.getFullPath(), !this.vaultCrtyptionWithPassword ? this.vaultSecret : undefined, this.vaultCrtyptionWithPassword ? this.vaultSecret : undefined).pipe(this.rxJSUtils.waitLoadingDialog()).subscribe({
          next: res => {
            this.onRouteChange();
          },
          error: (err) => {
            this.dialogUtils.openErrorMessage("Error", "Error when modifying vault");
          }
        });
      }
    }

    this.saveNameChange();
  }


}
