import { Component, OnInit } from '@angular/core';
import { EnsibleItemService } from '../../service/ensible-item/ensible-item.service';
import { EnsibleItem } from '../../model/ensible.model';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { Router } from '@angular/router';
import { EnsibleSettingService } from '../../service/ensible-setting/ensible-setting.service';
import { EnsibleSetting } from '../../model/ensible.setting.model';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { EnsibleDialogUtilsService } from '../../util/ensible-dialog-utils/ensible-dialog-utils.service';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { UserAccess } from 'projects/viescloud-utils/src/lib/model/Authenticator.model';
import { UserAccessInputType } from 'projects/viescloud-utils/src/lib/util-component/mat-form-field-input-user-access/mat-form-field-input-user-access.component';
import { FixChangeDetection } from 'projects/viescloud-utils/src/lib/directive/FixChangeDetection';

@Component({
  selector: 'app-ensible-item-list',
  templateUrl: './ensible-item-list.component.html',
  styleUrls: ['./ensible-item-list.component.scss']
})
export class EnsibleItemListComponent extends FixChangeDetection implements OnInit {

  items: EnsibleItem[] = [];
  blankItem: EnsibleItem = new EnsibleItem();

  useTable = false;

  currentPath = '/';

  constructor(
    private ensibleItemService: EnsibleItemService,
    private rxjsUtils: RxJSUtils,
    private dialogUtils: EnsibleDialogUtilsService,
    private router: Router,
    private ensibleSettingService: EnsibleSettingService
  ) {
    super();
  }

  ngOnInit(): void {
    this.init();
    this.useTable = !this.ensibleSettingService.getCopyOfGeneralSetting<EnsibleSetting>().UseTreeDisplayForItemList;
  }

  init() {
    this.ensibleItemService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.items = res;
      }
    });
  }

  addItem() {
    this.router.navigate(["item", 0], {queryParams: {path: this.currentPath}});
  }

  selectItem(item: EnsibleItem) {
    this.router.navigate(['item', item.id]);
  }

  getPath(item: EnsibleItem) {
    return item.path;
  }

  getLabel(item: EnsibleItem) {
    return item.name;
  }

  async modifyCurrentPathUserAccess() {
    let userAcess = await this.dialogUtils.openEnsibleUserAccessDialog(
      DataUtils.purgeValue(new UserAccess()),
      [UserAccessInputType.SHARED_USERS, UserAccessInputType.SHARED_GROUPS, UserAccessInputType.SHARED_OTHERS],
      false,
      'Modify user access of all item in path: ' + this.currentPath
    ).catch(err => undefined);

    if(userAcess) {
      let sharedUsers = userAcess.sharedUsers;
      let sharedGroups = userAcess.sharedGroups;
      let sharedOthers = userAcess.sharedOthers;
      this.items.forEach(item => {
        if(item.path === this.currentPath) {
          item.sharedUsers = sharedUsers;
          item.sharedGroups = sharedGroups;
          item.sharedOthers = sharedOthers;

          this.ensibleItemService.patch(item.id, item).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
            next: res => {},
            error: err => {
              this.dialogUtils.openErrorMessageFromError(err);
            }
          })
        }
      });

      this.init();
    }
  }
}
