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
    let dialog = this.matDialog.open(ConfirmDialog, {
      data: {
        title: 'Save locally',
        message: 'Do you want to save setting locally?\nNote: It will not be saved to server. Therefore, it will be lost if you close the window.',
        yes: 'Save',
        no: 'Cancel'
      },
      width: '100%'
    })

    dialog.afterClosed().subscribe(res => {
      if (res) {
        this.settingService.saveSettingLocally(this.generalSetting);
      }
    })
  }

  saveToServer() {
    if(this.settingService.prefix)
      this.settingService.saveSettingToServer(this.settingService.prefix, this.generalSetting);
  }

  isValueChange(): boolean {
    return !UtilsService.isEqual(this.generalSetting, this.generalSettingCopy);
  }

}
