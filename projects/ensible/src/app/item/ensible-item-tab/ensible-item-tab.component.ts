import { AfterContentChecked, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { EnsiblePlaybookItemService, EnsibleShellItemService } from '../../service/ensible-item/ensible-item.service';
import { EnsibleItemTypeEnum, EnsiblePlaybookItem, EnsiblePlaybookLogger, EnsibleShellItem, EnsibleShellLogger } from '../../model/ensible.model';
import { RouteUtils } from 'projects/viescloud-utils/src/lib/util/Route.utils';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { FixChangeDetection } from 'projects/viescloud-utils/src/lib/directive/FixChangeDetection';
import { RouteChangeSubcribe } from 'projects/viescloud-utils/src/lib/directive/RouteChangeSubcribe.directive';
import { ActivatedRoute } from '@angular/router';
import { CanDeactivateGuard, ComponentCanDeactivate } from 'projects/viescloud-utils/src/lib/guards/auth.guard';
import { Observable } from 'rxjs';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { EnsiblePlaybookLoggerService, EnsibleShellLoggerService } from '../../service/ensible-logger/ensible-logger.service';
import { EnsibleAnsibleWorkspaceService, EnsibleShellWorkspaceService } from '../../service/ensible-workspace/ensible-workspace.service';

class EnsibleItem {
  static PLAYBOOK = 'playbooks';
  static SHELL = 'shells';
  static TERRAFORM = 'terraforms'
  static UNKNOWN = 'unknown';

  static formType(type: string) {
    switch(type) {
      case EnsibleItem.PLAYBOOK:
        return EnsibleItem.PLAYBOOK;
      case EnsibleItem.SHELL:
        return EnsibleItem.SHELL;
      case EnsibleItem.TERRAFORM:
        return EnsibleItem.TERRAFORM;
      default:
        return EnsibleItem.UNKNOWN;
    }
  }
}

export type EnsibleItemServiceType = EnsiblePlaybookItemService | EnsibleShellItemService;
export type EnsibleItemType = EnsiblePlaybookItem | EnsibleShellItem;
export type EnsibleItemLoggerServiceType = EnsiblePlaybookLoggerService | EnsibleShellLoggerService;
export type EnsibleItemloggerType = EnsiblePlaybookLogger | EnsibleShellLogger;
export type EnsibleWorkspaceServiceType = EnsibleAnsibleWorkspaceService | EnsibleShellWorkspaceService;

@Component({
  selector: 'app-ensible-item-tab',
  templateUrl: './ensible-item-tab.component.html',
  styleUrls: ['./ensible-item-tab.component.scss']
})
export class EnsibleItemTabComponent extends RouteChangeSubcribe implements AfterContentChecked, ComponentCanDeactivate {

  item!: EnsibleItemType;
  itemCopy!: EnsibleItemType;

  selectedIndex: number = 0;
  tabNames: string[] = ['Item', 'Run histories', 'Runs'];

  isEditing: boolean = false;

  ItemType = EnsibleItem;
  itemType: string = EnsibleItem.UNKNOWN;

  constructor(
    public ensiblePlaybookItemService: EnsiblePlaybookItemService,
    public ensibleShellItemService: EnsibleShellItemService,
    public ensiblePlaybookLoggerService: EnsiblePlaybookLoggerService,
    public ensibleShellLoggerService: EnsibleShellLoggerService,
    public ensibleAnsibleWorkspaceService: EnsibleAnsibleWorkspaceService,
    public ensibleShellWorkspaceService: EnsibleShellWorkspaceService,
    private rxjsUtils: RxJSUtils,
    private cd: ChangeDetectorRef,
    private dialogUtils: DialogUtils,
    route: ActivatedRoute
  ) {
    super(route);
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    return CanDeactivateGuard.canDeactivateDialog(this.isValueChange(), this.dialogUtils.matDialog);
  }

  ngAfterContentChecked(): void {
    this.cd.detectChanges();
  }

  getEnsibleItemService() {
    switch(this.itemType) {
      case EnsibleItem.PLAYBOOK:
        return this.ensiblePlaybookItemService;
      case EnsibleItem.SHELL:
        return this.ensibleShellItemService;
      default:
        throw Error('Unknown item type');
    }
  }

  getEnsibleItemLoggerService() {
    switch(this.itemType) {
      case EnsibleItem.PLAYBOOK:
        return this.ensiblePlaybookLoggerService;
      case EnsibleItem.SHELL:
        return this.ensibleShellLoggerService;
      default:
        throw Error('Unknown item type');
    }
  }

  getEnsibleWorkspaceService() {
    switch(this.itemType) {
      case EnsibleItem.PLAYBOOK:
        return this.ensibleAnsibleWorkspaceService;
      case EnsibleItem.SHELL:
        return this.ensibleShellWorkspaceService;
      default:
        throw Error('Unknown item type');
    }
  }

  override async onRouteChange() {
    let type = EnsibleItem.formType(RouteUtils.getPathVariable('item') ?? '');
    this.itemType = type;
    let id = RouteUtils.getPathVariableAsInteger(type);

    if(type === EnsibleItem.UNKNOWN) {
      throw Error('Unknown item type');
    }

    if(!id) {
      this.item = DataUtils.purgeValue(this.getEnsibleItemService().newEmptyItem());
      this.item.dockerContainerTemplate = undefined;
    }
    else {
      if (type === EnsibleItem.PLAYBOOK) {
        this.ensiblePlaybookItemService.get(id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
          next: res => {
            this.item = res;
            this.itemCopy = structuredClone(this.item);
          }
        })
      }
      else if(type === EnsibleItem.SHELL) {
        this.ensibleShellItemService.get(id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
          next: res => {
            this.item = res;
            this.itemCopy = structuredClone(this.item);
          }
        })
      }
    }

    let tabParam = RouteUtils.getQueryParam('tab', true);
    if(tabParam) {
      let index = this.tabNames.findIndex(t => t === tabParam);
      if(index > 0)
        this.selectedIndex = index;
    }
  }

  getItemAsPlaybookItem() {
    return this.item as EnsiblePlaybookItem;
  }

  getItemAsShellItem() {
    return this.item as EnsibleShellItem;
  }

  isValueChange() {
    return DataUtils.isNotEqual(this.item, this.itemCopy);
  }

  indexChanged(index: number) {
    this.selectedIndex = index;
    RouteUtils.setQueryParam('tab', this.tabNames[index]);
  }

  static fromService(service: EnsibleItemServiceType | EnsibleItemLoggerServiceType | EnsibleItemloggerType | EnsibleWorkspaceServiceType) {
    if(service instanceof EnsiblePlaybookItemService || service instanceof EnsiblePlaybookLoggerService || service instanceof EnsiblePlaybookLogger || service instanceof EnsibleAnsibleWorkspaceService) {
      return EnsibleItemTypeEnum.ANSIBLE;
    }
    else if (service instanceof EnsibleShellItemService || service instanceof EnsibleShellLoggerService || service instanceof EnsibleShellLogger || service instanceof EnsibleShellWorkspaceService) {
      return EnsibleItemTypeEnum.SHELL;
    }
    else {
      return EnsibleItemTypeEnum.UNKNOWN;
    }
  }
}
