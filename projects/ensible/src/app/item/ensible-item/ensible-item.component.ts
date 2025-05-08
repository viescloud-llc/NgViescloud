import { EnsibleDockerContainerTemplate, EnsibleItem, EnsibleWebhookConfig } from './../../model/ensible.model';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { AfterContentChecked, Component, ContentChildren, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, SimpleChanges } from '@angular/core';
import { VERPOSITY_OPTIONS } from '../../model/ensible.model';
import { RouteUtils } from 'projects/viescloud-utils/src/lib/util/Route.utils';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { Router } from '@angular/router';
import { EnsibleService } from '../../service/ensible/ensible.service';
import { StringUtils } from 'projects/viescloud-utils/src/lib/util/String.utils';
import { EnsibleDockerContainerTemplateService } from '../../service/ensible-docker-container-template/ensible-docker-container-template.service';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/Mat.model';
import { UserAccessInputType } from 'projects/viescloud-utils/src/lib/util-component/mat-form-field-input-user-access/mat-form-field-input-user-access.component';
import { FileUtils } from 'projects/viescloud-utils/src/lib/util/File.utils';
import { ReflectionUtils } from 'projects/viescloud-utils/src/lib/util/Reflection.utils';
import { EnsibleFsService } from '../../service/ensible-fs/ensible-fs.service';
import { EnsibleItemService, EnsiblePlaybookItemService, EnsibleShellItemService } from '../../service/ensible-item/ensible-item.service';
import { EnsibleItemServiceType, EnsibleItemType } from '../ensible-item-tab/ensible-item-tab.component';
import { MatFormFieldComponent } from 'projects/viescloud-utils/src/lib/util-component/mat-form-field/mat-form-field.component';

@Component({
  selector: 'app-ensible-item',
  templateUrl: './ensible-item.component.html',
  styleUrls: ['./ensible-item.component.scss']
})
export class EnsibleItemComponent<T extends EnsibleItem> implements OnChanges, OnInit, AfterContentChecked {

  @Input()
  item!: T;

  @Input()
  blankItem!: T;

  @Input()
  itemService!: EnsibleItemService<T>;

  @Input()
  suffix!: string;
  
  @Output()
  itemChange: EventEmitter<T> = new EventEmitter();

  @Output()
  isEditing: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Output()
  onRevert: EventEmitter<void> = new EventEmitter<void>();

  itemCopy!: T;

  validForm: boolean = false;
  isFsEditing: boolean[] = [];

  verbosityOptions = VERPOSITY_OPTIONS;

  ensibleDockerContainerTemplateOptions: MatOption<EnsibleDockerContainerTemplate>[] = [];

  UserAccessInputType = UserAccessInputType;

  private CLONE_ITEM = "clone_item";

  @ContentChildren(MatFormFieldComponent, { descendants: true }) 
  contentChildrens!: QueryList<MatFormFieldComponent>;
  contentChildrensValidForms: boolean[] = [];

  webhookEnvironmentVariables: Record<string, string> = {} as Record<string, string>;
  webhookEnvironmentVariableList: string[] = [];
  cacheWebhookConfig?: EnsibleWebhookConfig;

  constructor(
    public ensibleFsService: EnsibleFsService,
    private rxjsUtils: RxJSUtils,
    private dialogUtils: DialogUtils,
    private router: Router,
    private ensibleDockerContainerTemplateService: EnsibleDockerContainerTemplateService
  ) { }

  ngAfterContentChecked(): void {
    let childrens = this.contentChildrens.toArray();

    if(this.contentChildrensValidForms.length > childrens.length) {
      this.contentChildrensValidForms = [];
    }

    for(let i = 0; i < childrens.length; i ++) {
      let matInput = childrens[i];
      this.contentChildrensValidForms[i] = matInput.isValidInput();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.ngOnInit();
  }

  ngOnInit(): void {
    if(this.item.id === 0) {
      let path = RouteUtils.getDecodedQueryParam('path');
      if(path) {
        this.item.path = path;
      }

      // if clone item
      let cloneItem = FileUtils.localStorageGetAndRemoveItem<T>(this.CLONE_ITEM) as T;

      if(cloneItem) {
        this.item = structuredClone(cloneItem);
        this.item.id = 0;
        this.item.name = '';
      }
    }

    if (!this.item.webhookConfig) {
      this.item.webhookConfig = new EnsibleWebhookConfig();
    }

    this.itemCopy = structuredClone(this.item);

    this.ensibleDockerContainerTemplateService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        res.forEach(e => {
          if(this.ensibleDockerContainerTemplateOptions.some(o => o.value.id === e.id)) return;
          this.ensibleDockerContainerTemplateOptions.push({
            value: e,
            valueLabel: `id: ${e.id}, name: ${e.name}, image: ${e.repository}`
          })
        })

        this.ensibleDockerContainerTemplateOptions.forEach(e => {
          if(e.value.id === this.item.dockerContainerTemplate?.id) {
            this.item.dockerContainerTemplate = structuredClone(e.value);
          }
        })
      }
    })
  }

  isValueChange() {
    let isChange = DataUtils.isNotEqual(this.item, this.itemCopy) || this.isFsEditing.some(e => e);
    this.isEditing.emit(isChange);
    this.checkWebhookVariables();
    return isChange;
  }

  save() {
    this.itemService.postOrPut(this.item.id, this.item).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        if(this.item.id === 0) {
          this.router.navigate(['item', this.suffix, res.id]);
        }

        this.itemChange.emit(res);
      },
      error: err => {
        this.dialogUtils.openErrorMessageFromError(err, 'Saving Error', 'Error saving item, please try again or refresh the page if the error persists');
      }
    })
  }

  revert() {
    this.item = structuredClone(this.itemCopy);
    this.onRevert.emit();
  }

  async deleteItem() {
    let yes = await this.dialogUtils.openConfirmDialog('Delete Item', 'Are you sure you want to delete this item?', 'Yes', 'No');

    if(!yes) return;

    this.itemService.delete(this.item.id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: () => {
        this.router.navigate(['item', this.suffix, 'all']);
      },
      error: err => {
        this.dialogUtils.openErrorMessageFromError(err, 'Deleting Error', 'Error deleting item, please try again or refresh the page if the error persists');
      }
    })
  }

  routeToFile(filePath: string) {
    if(!filePath.startsWith('/'))
      filePath = '/' + filePath;
    this.router.navigate(['/file', filePath]);
  }

  getGithubWebhookUrl() {
    return EnsibleService.getUri() + '/api/v1/webhooks/github';
  }

  getGitlabWebhookUrl() {
    return EnsibleService.getUri() + '/api/v1/webhooks/gitlab';
  }

  getBuildStatusUrl() {
    return `<iframe src="${EnsibleService.getUri()}/api/v1/playbook/loggers/item/${this.item.id}/status/html" width="100%" ></iframe>`;
  }

  formatValidPath(path: string) {
    return RouteUtils.formatValidUrlPath(path);
  }

  getCronDescription(cron: string) {
    return StringUtils.describeJavaCronExpression(cron);
  }

  log(any: any) {
    console.log(any);
  }

  clone() {
    FileUtils.localStorageSetItem(this.CLONE_ITEM, this.item);
    this.router.navigate(['item', this.suffix, 0]);
  }

  isValidForm() {
    return this.validForm && this.contentChildrensValidForms.every(e => e === true);
  }

  checkWebhookVariables() {
    if(this.item.webhookConfig) {
      let config = this.item.webhookConfig;
      if(!this.cacheWebhookConfig || DataUtils.isSimpleNotEqual(this.cacheWebhookConfig, config)) {
        this.webhookEnvironmentVariables = {} as Record<string, string>;
        this.webhookEnvironmentVariableList = [];
  
        this.addWebhookVariable(config.webhookAddRepositoryName, config.webhookVariableRepositoryName);
        this.addWebhookVariable(config.webhookAddRepositoryOwnerOrOrganization, config.webhookVariableRepositoryOwnerOrOrganization);
        this.addWebhookVariable(config.webhookAddRepositoryUrl, config.webhookVariableRepositoryUrl);
        this.addWebhookVariable(config.webhookAddRepositoryDefaultBranch, config.webhookVariableRepositoryDefaultBranch);
        
        this.addWebhookVariable(config.webhookAddCommitShaOrId, config.webhookVariableCommitShaOrId);
        this.addWebhookVariable(config.webhookAddCommitMessage, config.webhookVariableCommitMessage);
        this.addWebhookVariable(config.webhookAddCommitAuthor, config.webhookVariableCommitAuthor);
        this.addWebhookVariable(config.webhookAddCommitTimeStamp, config.webhookVariableCommitTimeStamp);
        this.addWebhookVariable(config.webhookAddFilesChanged, config.webhookVariableFilesChanged);
        this.addWebhookVariable(config.webhookAddDiffStatistic, config.webhookVariableDiffStatistic);
        
        this.addWebhookVariable(config.webhookAddBranchName, config.webhookVariableBranchName);
        this.addWebhookVariable(config.webhookAddBaseBranch, config.webhookVariableBaseBranch);
        this.addWebhookVariable(config.webhookAddIsDefaultBranch, config.webhookVariableIsDefaultBranch);
        
        this.addWebhookVariable(config.webhookAddEventType, config.webhookVariableEventType);
        this.addWebhookVariable(config.webhookAddEventId, config.webhookVariableEventId);
        this.addWebhookVariable(config.webhookAddEventTriggeredWorkflowOrPipelineName, config.webhookVariableEventTriggeredWorkflowOrPipelineName);
        
        this.addWebhookVariable(config.webhookAddPullOrMergeNumberOrId, config.webhookVariablePullOrMergeNumberOrId);
        this.addWebhookVariable(config.webhookAddPullOrMergeTitle, config.webhookVariablePullOrMergeTitle);
        this.addWebhookVariable(config.webhookAddPullOrMergeDescription, config.webhookVariablePullOrMergeDescription);
        this.addWebhookVariable(config.webhookAddPullOrMergeState, config.webhookVariablePullOrMergeState);
        this.addWebhookVariable(config.webhookAddPullOrMergeLabels, config.webhookVariablePullOrMergeLabels);
        this.addWebhookVariable(config.webhookAddPullOrMergeReviewers, config.webhookVariablePullOrMergeReviewers);
        this.addWebhookVariable(config.webhookAddPullOrMergeApprovialCount, config.webhookVariablePullOrMergeApprovialCount);
        
        this.addWebhookVariable(config.webhookAddTagName, config.webhookVariableTagName);
        this.addWebhookVariable(config.webhookAddTagMessage, config.webhookVariableTagMessage);
        this.addWebhookVariable(config.webhookAddTagNameAndEmail, config.webhookVariableTagNameAndEmail);
        
        this.addWebhookVariable(config.webhookAddTriggeredUsername, config.webhookVariableTriggeredUsername);
        this.addWebhookVariable(config.webhookAddTriggeredUserEmail, config.webhookVariableTriggeredUserEmail);
        this.addWebhookVariable(config.webhookAddTriggeredUserPermissionOrRole, config.webhookVariableTriggeredUserPermissionOrRole);
        
        this.cacheWebhookConfig = structuredClone(config);
      }
    }
  }

  private addWebhookVariable(condition: boolean, variableName: string) {
    if(condition && variableName) {
      this.webhookEnvironmentVariables[variableName] = `Git-sourced value (or ${this.item.webhookConfig.webhookDefaultEmptyValue})`;
      this.webhookEnvironmentVariableList.push(`Git-sourced value (or ${this.item.webhookConfig.webhookDefaultEmptyValue})`)
    }
  }
}
