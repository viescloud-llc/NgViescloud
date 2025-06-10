import { Component, OnInit } from '@angular/core';
import { GeneralSetting, WrapSetting } from 'projects/viescloud-utils/src/lib/model/setting.model';
import { ApplicationSettingComponent } from 'projects/viescloud-utils/src/lib/share-component/application-setting/application-setting.component';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { ReflectionUtils } from 'projects/viescloud-utils/src/lib/util/Reflection.utils';

@Component({
  selector: 'app-wrap-setting',
  templateUrl: './wrap-setting.component.html',
  styleUrls: ['./wrap-setting.component.scss']
})
export class WrapSettingComponent extends ApplicationSettingComponent {
  override generalSetting!: WrapSetting;
  override generalSettingCopy!: WrapSetting;
  override blankGeneralSetting: WrapSetting = new WrapSetting();

  override isValueChange(): boolean {
    return DataUtils.isNotEqualWith(this.generalSetting, this.generalSettingCopy, this.blankGeneralSetting);
  }
}
