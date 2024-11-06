import { MatInputDisplayLabel, MatInputHide, MatInputItemSetting, MatItemSettingType } from "./Mat.model";
import { MatTheme } from "./theme.model";

export class GeneralSetting {

    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true)
    @MatInputDisplayLabel('Initial Display Header (this setting usually should not be changed)')
    initDisplayHeader: boolean = true;

    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true)
    @MatInputDisplayLabel('Initial Display Drawer')
    initDisplayDrawer: boolean = true;

    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true)
    @MatInputDisplayLabel('Prompt Login when timeout logout')
    promptLoginWhenTimeoutLogout: boolean = true;

    @MatInputHide(true)
    backgroundImageUrl: string = '';

    @MatInputHide(true)
    theme: MatTheme = MatTheme.CyanDeepPurpleDark;
}

export class D {
    da: string = 'da';
    db: number = 0;
    dc: boolean = true;
}