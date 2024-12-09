import { AfterContentInit, AfterViewInit, Injectable, OnInit, Renderer2 } from '@angular/core';
import { environment } from 'projects/environments/environment.prod';
import { DRAWER_STATE, HeaderComponent } from '../share-component/header/header.component';
import { ObjectStorage, S3StorageServiceV1 } from './ObjectStorageManager.service';
import { VFile } from './Utils.service';
import { GeneralSetting } from '../model/Setting.model';
import { MatDialog } from '@angular/material/dialog';
import { MatTheme } from '../model/theme.model';
import { AuthenticatorService } from './Authenticator.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialog } from '../dialog/confirm-dialog/confirm-dialog.component';
import { OpenIdService } from './OpenId.service';
import { PopupType } from '../model/Popup.model';
import { RxJSUtils } from '../util/RxJS.utils';
import { DataUtils } from '../util/Data.utils';
import { FileUtils } from '../util/File.utils';
import { StringUtils } from '../util/String.utils';
import { Subject } from 'rxjs';
import { RouteUtil } from '../util/Route.utils';
import { HeaderMinimalComponent } from '../share-component/header-minimal/header-minimal.component';

@Injectable({
  providedIn: 'root'
})
export class SettingService {
  private GENERAL_SETTING_KEY = 'generalSetting.json';
  private generalSetting: GeneralSetting = new GeneralSetting();
  private matThemes = DataUtils.getEnumValues(MatTheme) as string[];
  private onLoginSubscription: any = null;
  private onTimeoutLogoutSubscription: any = null;
  private authenticatorService: AuthenticatorService | undefined;

  private onGeneralSettingChangeSubject = new Subject<void>();
  onGeneralSettingChange = this.onGeneralSettingChangeSubject.asObservable();

  onToggleDisplayDrawerSubject = new Subject<DRAWER_STATE>();
  onToggleDisplayDrawer$ = this.onToggleDisplayDrawerSubject.asObservable();

  prefix = '';
  currentMenu = "main";
  apiGatewayUrl: string = environment.gateway_api;
  backgroundImageUrl: string = '';
  header?: HeaderComponent | HeaderMinimalComponent;
  matThemeOptions = DataUtils.getEnumMatOptions(MatTheme);

  constructor(
    private s3StorageService: S3StorageServiceV1,
    private matDialog: MatDialog,
    private snackBar: MatSnackBar,
    private openIdService: OpenIdService
  ) { }

  initMinimal(prefix: string) {
    let setting = FileUtils.localStorageGetItem<GeneralSetting>(this.GENERAL_SETTING_KEY) ?? new GeneralSetting();
    this.generalSetting = setting;
    this.applySetting();
  }

  init(prefix: string, authenticatorService?: AuthenticatorService) {
    this.subscribeToSubject(prefix, authenticatorService);

    this.prefix = prefix;

    let setting = FileUtils.localStorageGetItem<GeneralSetting>(this.GENERAL_SETTING_KEY);

    if (!setting || setting.initAutoFetchGeneralSetting) {
      this.syncFromServer(prefix);
    }
    else {
      this.generalSetting = setting;
      this.applySetting();
    }

    this.onGeneralSettingChangeSubject.next();
  }

  private subscribeToSubject(prefix: string, authenticatorService: AuthenticatorService | undefined) {
    if(authenticatorService) {
      this.authenticatorService = authenticatorService;

      if(this.onLoginSubscription == null) {
        this.onLoginSubscription = authenticatorService.onLogin$.subscribe({
          next: () => {
            this.syncFromServer(prefix);
          }
        });
      }

      if(this.onTimeoutLogoutSubscription == null) {
        this.onTimeoutLogoutSubscription = authenticatorService.onTimeoutLogout$.subscribe({
          next: () => {
            if(this.generalSetting.promptLoginWhenTimeoutLogout)
              this.promptLoginWhenTimeoutLogout();
          }
        });
      }
    }
  }

  syncFromServer(prefix: string) {
    this.s3StorageService.getFileByFileName(`${prefix}/${this.GENERAL_SETTING_KEY}`).pipe(RxJSUtils.waitLoadingDynamicStringSnackBar(this.snackBar, `Loading ${prefix}/${this.GENERAL_SETTING_KEY}`, 40, 'Dismiss')).subscribe({
      next: (blob) => {
        StringUtils.readBlobAsText(blob).then((data) => {
          this.generalSetting = JSON.parse(data);
          this.onGeneralSettingChangeSubject.next();
          this.saveSettingLocally(this.generalSetting);
          this.applySetting();
        });
      },
      error: (error) => {
        this.generalSetting = new GeneralSetting();
        this.applySetting();
      }
    });
  }

  applySetting() {
    this.generalSetting.theme = this.generalSetting.theme ? this.generalSetting.theme : MatTheme.CyanDeepPurpleLight;
    this.changeTheme(this.generalSetting.theme);
  }

  getCopyOfGeneralSetting<T extends GeneralSetting>(): T {
    return JSON.parse(JSON.stringify(this.generalSetting));
  }

  getGatewayUrl(): string {
    return this.apiGatewayUrl;
  }

  getDisplayHeader(): boolean {
    return this.generalSetting.initDisplayHeader;
  }

  setDisplayHeader(value: boolean): void {
    this.generalSetting.initDisplayHeader = value;
  }

  getDisplayDrawer(): boolean {
    return this.generalSetting.initDisplayDrawer;
  }

  setDisplayDrawer(value: boolean): void {
    this.generalSetting.initDisplayDrawer = value;
    if(this.header) {
      let state = this.generalSetting.initDisplayDrawer ? DRAWER_STATE.OPEN : DRAWER_STATE.CLOSE;
      this.header.toggleDrawer(this.generalSetting.initDisplayDrawer ? DRAWER_STATE.OPEN : DRAWER_STATE.CLOSE);
    }
  }

  toggleDisplayHeader(): void {
    this.generalSetting.initDisplayDrawer = !this.generalSetting.initDisplayDrawer;
  }

  toggleDisplayDrawer(): void {
    this.generalSetting.initDisplayDrawer = !this.generalSetting.initDisplayDrawer;
    this.setDisplayDrawer(this.generalSetting.initDisplayDrawer);
  }

  saveSettingLocally(generalSetting: GeneralSetting): void {
    FileUtils.localStorageSetItem(this.GENERAL_SETTING_KEY, generalSetting);
    this.generalSetting = generalSetting;
  }

  saveSettingToServer(prefix: string, generalSetting: GeneralSetting): void {
    this.saveSettingLocally(generalSetting);

    let vFile: VFile = {
      name: prefix + '/' + this.GENERAL_SETTING_KEY,
      type: 'application/json',
      extension: 'json',
      rawFile: new Blob([JSON.stringify(generalSetting)], {type: 'application/json'}),
      value: JSON.stringify(generalSetting)
    }

    this.s3StorageService.putOrPostFile(vFile, false, PopupType.LOADING_DIALOG).then((data) => {}).catch((error) => {
      window.alert(error);
    });
  }

  changeTheme(matTheme: MatTheme) {
    // Remove any previous theme class from the body
    document.body.classList.remove(... this.matThemes);

    // Add the selected theme class
    document.body.classList.add(matTheme);
  }

  changeToCurrentTheme() {
    this.changeTheme(this.generalSetting.theme);
  }

  promptLoginWhenTimeoutLogout() {
    let dialog = this.matDialog.open(ConfirmDialog, {
      data: {
        title: 'Login?',
        message: 'You have been logged out due to inactivity.\nDo you want to login again?',
        yes: 'Login',
        no: 'Cancel'
      },
      width: '100%'
    })

    dialog.afterClosed().subscribe({
      next: res => {
        if(res) {
          this.openIdService.authorizeFlow();
        }
      }
    })
  }

  getCurrentThemeTextColor(): string {
    if(this.generalSetting.theme.toLowerCase().includes('light'))
      return 'black';
    else
      return 'white';
  }

  loadBackgroundImage(url: string, objectStorage?: ObjectStorage, popupType: PopupType = PopupType.DYNAMIC_MESSAGE_POPUP, rememberInitialUrl: boolean = true) {
    let currentRoute = RouteUtil.getCurrentUrl();
    if(url.includes(environment.gateway_api) && objectStorage) {
      objectStorage.generateObjectUrlFromViescloudUrl(url, popupType).then(res => {
        if(rememberInitialUrl && RouteUtil.getCurrentUrl() === currentRoute)
          this.backgroundImageUrl = res;
      })
    }
    else {
      this.backgroundImageUrl = url;
    }
  }
}
