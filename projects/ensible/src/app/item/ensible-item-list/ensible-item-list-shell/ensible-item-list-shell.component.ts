import { Component } from '@angular/core';
import { EnsibleItemListComponent } from '../ensible-item-list.component';
import { EnsibleShellItem } from '../../../model/ensible.model';
import { EnsibleShellItemService } from '../../../service/ensible-item/ensible-item.service';

import { Router } from '@angular/router';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { SnackBarUtils } from 'projects/viescloud-utils/src/lib/util/SnackBar.utils';
import { EnsibleSettingService } from '../../../service/ensible-setting/ensible-setting.service';
import { EnsibleDialogUtilsService } from '../../../util/ensible-dialog-utils/ensible-dialog-utils.service';

@Component({
  selector: 'app-ensible-item-list-shell',
  templateUrl: '../ensible-item-list.component.html',
  styleUrls: ['../ensible-item-list.component.scss']
})
export class EnsibleItemListShellComponent extends EnsibleItemListComponent<EnsibleShellItem> {

  constructor(
    ensibleShellItemService: EnsibleShellItemService,
    rxjsUtils: RxJSUtils,
    dialogUtils: EnsibleDialogUtilsService,
    router: Router,
    ensibleSettingService: EnsibleSettingService,
    snackBarUtils: SnackBarUtils
  ) {
    super(ensibleShellItemService, rxjsUtils, dialogUtils, router, ensibleSettingService, snackBarUtils);
  }

  override getPathSuffix(): string {
    return 'shells'
  }
}
