import { AfterContentChecked, AfterContentInit, AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { SettingService } from '../../service/setting.service';
import { GeneralSetting } from '../../model/setting.model';
import { AuthenticatorService } from '../../service/authenticator.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from '../../dialog/confirm-dialog/confirm-dialog.component';
import { DataUtils } from '../../util/Data.utils';

@Component({
  selector: 'app-application-setting',
  templateUrl: './application-setting.component.html',
  styleUrls: ['./application-setting.component.scss']
})
export class ApplicationSettingComponent implements OnInit, OnDestroy {

  generalSetting!: GeneralSetting;
  generalSettingCopy!: GeneralSetting;
  blankGeneralSetting: GeneralSetting = new GeneralSetting();

  constructor(
    public settingService: SettingService,
    public authenticatorService: AuthenticatorService,
    private matDialog: MatDialog
  ) { 
    settingService.onGeneralSettingChange.subscribe({
      next: () => {
        this.ngOnInit();
      }
    });
  }

  ngOnInit() {
    this.generalSetting = this.settingService.getCopyOfGeneralSetting();
    this.generalSettingCopy = structuredClone(this.settingService.getCopyOfGeneralSetting());
  }

  ngOnDestroy(): void {
    this.revert();
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
}
