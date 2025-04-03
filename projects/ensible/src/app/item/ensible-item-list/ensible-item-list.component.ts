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
import { FileUtils } from 'projects/viescloud-utils/src/lib/util/File.utils';
import { SnackBarUtils } from 'projects/viescloud-utils/src/lib/util/SnackBar.utils';

@Component({
  selector: 'app-ensible-item-list',
  templateUrl: './ensible-item-list.component.html',
  styleUrls: ['./ensible-item-list.component.scss']
})
export class EnsibleItemListComponent<T extends EnsibleItem> extends FixChangeDetection implements OnInit {

  items: T[] = [];
  blankItem!: T;

  useTable = false;

  currentPath = '/';

  constructor(
    private ensibleItemService: EnsibleItemService<T>,
    private rxjsUtils: RxJSUtils,
    private dialogUtils: EnsibleDialogUtilsService,
    private router: Router,
    private ensibleSettingService: EnsibleSettingService,
    private snackBarUtils: SnackBarUtils
  ) {
    super();
    this.blankItem = ensibleItemService.newEmptyItem();
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

  selectItem(item: T) {
    this.router.navigate(['item', item.id]);
  }

  getPath(item: T) {
    return item.path;
  }

  getLabel(item: T) {
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

  backupItems() {
    if(this.useTable) {
      FileUtils.saveFile('itemsBackup.json', 'application/json', JSON.stringify(this.items));
    }
    else {
      FileUtils.saveFile('itemsBackup.json', 'application/json', JSON.stringify(this.items.filter(item => item.path === this.currentPath)));
    }
  }

  async restoreItems() {
    let file = await FileUtils.uploadFileAsVFile('application/json').catch(err => undefined);
    if (file) {
      let items = JSON.parse(file.value);

      let override = await this.dialogUtils.openConfirmDialog("Restore", "If any item is already exist, do you want to override it?", "Yes", "No").catch(err => '');

      for (let item of items) {
        let index = this.items.findIndex(e => e.path === item.path && e.name === item.name);
        // if already exist and override
        if (index > -1 && override) {
          let currentItem = this.items[index];
          this.ensibleItemService.put(currentItem.id, item).subscribe({
            next: res => {
              this.snackBarUtils.openSnackBarDynamicString('Item ' + item.name + ' has been restored (updated/override)');
            },
            error: err => {
              this.snackBarUtils.openSnackBarDynamicString(`Error restoring item ${item.name}`);
            }
          });
        }
        else if (index === -1) {
          item.id = 0;
          this.ensibleItemService.post(item).subscribe({
            next: res => {
              this.snackBarUtils.openSnackBarDynamicString('Item ' + item.name + ' has been restored (created)');
            },
            error: err => {
              this.snackBarUtils.openSnackBarDynamicString(`Error restoring item ${item.name}`);
            }
          })
        }
      }

      this.init();
      return;
    }

    this.dialogUtils.openErrorMessage("Error", "Error when restoring items (invalid or corrupted file)");
  }
}
