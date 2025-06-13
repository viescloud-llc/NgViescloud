import { ReflectionUtils } from "../util/Reflection.utils";
import { MatInputDisplayLabel, MatInputEnum, MatInputHide, MatInputIndex, MatInputItemSetting, MatInputOptions, MatItemSettingType } from "./mat.model";
import { MatTheme } from "./theme.model";

export class GeneralSetting {

    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true)
    @MatInputDisplayLabel('Initial display header (this setting usually should not be changed)')
    @MatInputIndex(10)
    initDisplayHeader: boolean = true;

    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true)
    @MatInputDisplayLabel('Initial display drawer')
    @MatInputIndex(11)
    initDisplayDrawer: boolean = true;

    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true)
    @MatInputDisplayLabel('Initial auto fetch general setting')
    @MatInputIndex(12)
    initAutoFetchGeneralSetting: boolean = true;

    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true)
    @MatInputDisplayLabel('Prompt login when timeout logout')
    @MatInputIndex(13)
    promptLoginWhenTimeoutLogout: boolean = true;

    @MatInputHide(true)
    backgroundImageUrl: string = '';

    @MatInputEnum(MatTheme)
    @MatInputIndex(100)
    theme: MatTheme = MatTheme.CyanDeepPurpleDark;
}