import { MatInputItemSetting, MatItemSettingType, MatInputDisplayLabel, MatInputIndex } from "projects/viescloud-utils/src/lib/model/mat.model";
import { GeneralSetting } from "projects/viescloud-utils/src/lib/model/setting.model";
import { ReflectionUtils } from "projects/viescloud-utils/src/lib/util/Reflection.utils";

export class EnsibleSetting extends GeneralSetting {

  @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true)
  @MatInputDisplayLabel('Hide workspace tree')
  @MatInputIndex(14)
  hideWorkspaceTree: boolean = true;

  @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true)
  @MatInputDisplayLabel('Use tree display for item list')
  @MatInputIndex(15)
  UseTreeDisplayForItemList: boolean = true;

  constructor() {
    super();
    ReflectionUtils.copyAllParentPrototype(this);
  }
}
