import { EnsibleDockerContainerTemplate, EnsibleItem } from './../../model/ensible.model';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { EnsiblePlaybookItemService } from '../../service/ensible-item/ensible-item.service';
import { T, VERPOSITY_OPTIONS } from '../../model/ensible.model';
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

@Component({
  selector: 'app-ensible-item',
  templateUrl: './ensible-item.component.html',
  styleUrls: ['./ensible-item.component.scss']
})
export class EnsibleItemComponent<T extends EnsibleItem> implements OnChanges, OnInit {

  @Input()
  item!: T;

  @Output()
  itemChange: EventEmitter<T> = new EventEmitter();

  @Output()
  isEditing: EventEmitter<boolean> = new EventEmitter<boolean>();

  itemCopy!: T;
  blankItem: T = new T();

  validForm: boolean = false;
  isFsEditing: boolean[] = [];

  verbosityOptions = VERPOSITY_OPTIONS;

  ensibleDockerContainerTemplateOptions: MatOption<EnsibleDockerContainerTemplate>[] = [];

  UserAccessInputType = UserAccessInputType;

  private CLONE_ITEM = "clone_item";

  constructor(
    private ensibleItemService: EnsiblePlaybookItemService,
    public ensibleFsService: EnsibleFsService,
    private rxjsUtils: RxJSUtils,
    private dialogUtils: DialogUtils,
    private router: Router,
    private ensibleDockerContainerTemplateService: EnsibleDockerContainerTemplateService
  ) { }

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
    return isChange;
  }

  save() {
    this.ensibleItemService.postOrPut(this.item.id, this.item).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        if(this.item.id === 0) {
          this.router.navigate(['item', res.id]);
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
  }

  async deleteItem() {
    let yes = await this.dialogUtils.openConfirmDialog('Delete Item', 'Are you sure you want to delete this item?', 'Yes', 'No');

    if(!yes) return;

    this.ensibleItemService.delete(this.item.id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: () => {
        this.router.navigate(['item', 'all']);
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
    this.router.navigate(["/item/0"]);
  }
}
