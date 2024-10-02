import { MatTheme } from "./theme.model";

export class GeneralSetting {
    initDisplayHeader: boolean = true;
    initDisplayDrawer: boolean = true;
    promptLoginWhenTimeoutLogout: boolean = true;
    backgroundImageUrl: string = '';
    theme: MatTheme = MatTheme.CyanDeepPurpleDark;
}

export class D {
    da: string = 'da';
    db: number = 0;
    dc: boolean = true;
}