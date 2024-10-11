import { Component, OnInit } from '@angular/core';
import { SettingService } from '../../service/Setting.service';
import { GeneralSetting } from '../../model/Setting.model';
import { AuthenticatorService } from '../../service/Authenticator.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from '../../dialog/confirm-dialog/confirm-dialog.component';
import { UtilsService } from '../../service/Utils.service';

@Component({
  selector: 'app-application-setting',
  templateUrl: './application-setting.component.html',
  styleUrls: ['./application-setting.component.scss']
})
export class ApplicationSettingComponent implements OnInit {

  generalSetting!: GeneralSetting;
  generalSettingCopy!: GeneralSetting;

  constructor(
    public settingService: SettingService,
    public authenticatorService: AuthenticatorService,
    private matDialog: MatDialog
  ) { }

  ngOnInit() {
    this.generalSetting = this.settingService.getCopyOfGeneralSetting();
    this.generalSettingCopy = this.settingService.getCopyOfGeneralSetting();
  }

  saveLocally() {
    this.settingService.saveSettingLocally(this.generalSetting);
    this.ngOnInit();
  }

  saveToServer() {
    if(this.settingService.prefix) {
      this.settingService.saveSettingToServer(this.settingService.prefix, this.generalSetting);
      this.ngOnInit();
    }
  }

  isValueChange(): boolean {
    return !UtilsService.isEqual(this.generalSetting, this.generalSettingCopy);
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
}
