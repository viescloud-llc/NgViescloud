import { EnsibleAuthenticatorService } from './../service/ensible-authenticator/ensible-authenticator.service';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from 'projects/viescloud-utils/src/lib/dialog/confirm-dialog/confirm-dialog.component';
import { GeneralSetting } from 'projects/viescloud-utils/src/lib/model/Setting.model';
import { MatTheme } from 'projects/viescloud-utils/src/lib/model/theme.model';
import { SettingService } from 'projects/viescloud-utils/src/lib/service/Setting.service';
import { ApplicationSettingComponent } from 'projects/viescloud-utils/src/lib/share-component/application-setting/application-setting.component';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { EnsibleSetting } from '../model/ensible.setting.model';
import { EnsibleSettingService } from '../service/ensible-setting/ensible-setting.service';
import { EnsibleFsService } from '../service/ensible-fs/ensible-fs.service';

@Component({
  selector: 'app-ensible-setting',
  templateUrl: './ensible-setting.component.html',
  styleUrls: ['./ensible-setting.component.scss']
})
export class EnsibleSettingComponent implements OnInit {

  generalSetting!: EnsibleSetting;
  generalSettingCopy!: EnsibleSetting;
  blankGeneralSetting: EnsibleSetting = new EnsibleSetting();

  constructor(
    public settingService: EnsibleSettingService,
    public ensibleAuthenticatorService: EnsibleAuthenticatorService,
    private matDialog: MatDialog,
    private ensibleFsService: EnsibleFsService
  ) {
    settingService.onGeneralSettingChange.subscribe({
      next: () => {
        this.ngOnInit();
      }
    });
  }

  ngOnInit() {
    this.generalSetting = this.settingService.getCopyOfGeneralSetting<EnsibleSetting>();
    this.generalSettingCopy = structuredClone(this.settingService.getCopyOfGeneralSetting<EnsibleSetting>());
  }

  ngOnDestroy(): void {
    this.revert();
  }

  saveLocally() {
    this.settingService.saveSettingLocally(this.generalSetting);
    this.ensibleFsService.triggerFetchWorkspace();
    this.ngOnInit();
  }

  saveToServer() {
    if(this.settingService.prefix) {
      this.settingService.saveSettingToServer(this.settingService.prefix, this.generalSetting);
      this.ensibleFsService.triggerFetchWorkspace();
      this.ngOnInit();
    }
  }

  isValueChange(): boolean {
    return !DataUtils.isEqualWith(this.generalSetting, this.generalSettingCopy, this.blankGeneralSetting);
  }

  revert() {
    this.generalSetting = structuredClone(this.generalSettingCopy);
    this.settingService.applySetting();
  }

  reSync() {
    let dialog = this.matDialog.open(ConfirmDialog, {
      data: {
        message: 'Are you sure you want to re-sync?\nNote: All your changes locally will be lost.',
        title: 'Re-sync',
        yes: 'Re-sync',
        no: 'Cancel'
      },
      width: '100%'
    })

    dialog.afterClosed().subscribe(res => {
      if(res) {
        this.settingService.syncFromServer(this.settingService.prefix);
      }
    })
  }

  changeTheme() {
    this.settingService.changeTheme(this.generalSetting.theme);
  }
}
