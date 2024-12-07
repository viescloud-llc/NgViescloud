import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GeneralSetting } from 'projects/viescloud-utils/src/lib/model/Setting.model';
import { MatTheme } from 'projects/viescloud-utils/src/lib/model/theme.model';
import { SettingService } from 'projects/viescloud-utils/src/lib/service/Setting.service';
import { ApplicationSettingComponent } from 'projects/viescloud-utils/src/lib/share-component/application-setting/application-setting.component';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';

@Component({
  selector: 'app-ensible-setting',
  templateUrl: './ensible-setting.component.html',
  styleUrls: ['./ensible-setting.component.scss']
})
export class EnsibleSettingComponent implements OnInit {
  generalSetting!: GeneralSetting;
  generalSettingCopy!: GeneralSetting;
  blankGeneralSetting: GeneralSetting = new GeneralSetting();

  constructor(
    public settingService: SettingService
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

  changeTheme() {
    this.settingService.changeTheme(this.generalSetting.theme);
  }
}
