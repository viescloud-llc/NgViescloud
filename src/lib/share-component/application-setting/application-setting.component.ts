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
  styleUrls: ['./application-setting.component.scss'],
  standalone: false
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
    this.syncGeneralSetting();
    this.generalSettingCopy = structuredClone(this.generalSetting);
  }

  ngOnDestroy(): void {
    this.revert();
  }

  syncGeneralSetting() {
    if(!this.generalSetting) {
      this.generalSetting = {
        initAutoFetchGeneralSetting: this.settingService.applicationSetting.get<boolean>('primitive', ...this.settingService.DEFAULT_GENERAL_SETTING_PATHS.initalAutoFetchGeneralSetting) ?? true,
        initDisplayDrawer: this.settingService.applicationSetting.get<boolean>('primitive', ...this.settingService.DEFAULT_GENERAL_SETTING_PATHS.initalDisplayDrawer) ?? true,
        initDisplayHeader: this.settingService.applicationSetting.get<boolean>('primitive', ...this.settingService.DEFAULT_GENERAL_SETTING_PATHS.initalDisplayHeader) ?? true,
        promptLoginWhenTimeoutLogout: this.settingService.applicationSetting.get<boolean>('primitive', ...this.settingService.DEFAULT_GENERAL_SETTING_PATHS.promptLoginWhenTimeoutLogout) ?? true,
        backgroundImageUrl: this.settingService.applicationSetting.get<string>('primitive', ...this.settingService.DEFAULT_GENERAL_SETTING_PATHS.backgroundImageUrl) ?? '',
        theme: this.settingService.getCurrentTheme()
      }
    }
    
    this.settingService.applicationSetting.set(this.generalSetting.initAutoFetchGeneralSetting, ...this.settingService.DEFAULT_GENERAL_SETTING_PATHS.initalAutoFetchGeneralSetting);
    this.settingService.applicationSetting.set(this.generalSetting.initDisplayDrawer, ...this.settingService.DEFAULT_GENERAL_SETTING_PATHS.initalDisplayDrawer);
    this.settingService.applicationSetting.set(this.generalSetting.initDisplayHeader, ...this.settingService.DEFAULT_GENERAL_SETTING_PATHS.initalDisplayHeader);
    this.settingService.applicationSetting.set(this.generalSetting.promptLoginWhenTimeoutLogout, ...this.settingService.DEFAULT_GENERAL_SETTING_PATHS.promptLoginWhenTimeoutLogout);
    this.settingService.applicationSetting.set(this.generalSetting.backgroundImageUrl, ...this.settingService.DEFAULT_GENERAL_SETTING_PATHS.backgroundImageUrl);
    this.settingService.applicationSetting.set(this.generalSetting.theme, ...this.settingService.DEFAULT_GENERAL_SETTING_PATHS.theme);
  }

  saveLocally() {
    this.syncGeneralSetting();
    this.settingService.saveSettingLocally();
    this.ngOnInit();
  }

  saveToServer() {
    if(this.settingService.prefix) {
      this.syncGeneralSetting();
      this.settingService.saveSettingToServer(this.settingService.prefix);
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
