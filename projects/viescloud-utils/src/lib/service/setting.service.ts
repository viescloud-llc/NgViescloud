import { AfterContentInit, AfterViewInit, Injectable, Injector, OnInit, Renderer2 } from '@angular/core';
import { environment } from 'projects/environments/environment.prod';
import { DRAWER_STATE, HeaderComponent } from '../share-component/header/header.component';
import { ObjectStorage, ObjectStorageService } from './object-storage-manager.service';
import { VFile } from '../model/vies.model';
import { GeneralSetting } from '../model/setting.model';
import { MatDialog } from '@angular/material/dialog';
import { MatTheme } from '../model/theme.model';
import { AuthenticatorService } from './authenticator.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialog } from '../dialog/confirm-dialog/confirm-dialog.component';
import { PopupArgs, PopupType } from '../model/popup.model';
import { RxJSUtils } from '../util/RxJS.utils';
import { DataUtils } from '../util/Data.utils';
import { FileUtils } from '../util/File.utils';
import { StringUtils } from '../util/String.utils';
import { Subject } from 'rxjs';
import { RouteUtils } from '../util/Route.utils';
import { HeaderMinimalComponent } from '../share-component/header-minimal/header-minimal.component';
import { Router } from '@angular/router';
import { ViesService } from './rest.service';

@Injectable({
  providedIn: 'root'
})
export class SettingService<T extends GeneralSetting> {
  protected GENERAL_SETTING_KEY = 'generalSetting.json';
  protected generalSetting: T = this.newSetting();
  protected matThemes = DataUtils.getEnumValues(MatTheme) as string[];
  protected authenticatorService: AuthenticatorService | undefined;
  protected onLoginSubscription: any = null;
  protected onTimeoutLogoutSubscription: any = null;

  protected onGeneralSettingChangeSubject = new Subject<void>();
  onGeneralSettingChange = this.onGeneralSettingChangeSubject.asObservable();

  onToggleDisplayDrawerSubject = new Subject<DRAWER_STATE>();
  onToggleDisplayDrawer$ = this.onToggleDisplayDrawerSubject.asObservable();

  prefix = '';
  currentMenu = "main";
  apiGatewayUrl: string = ViesService.getGatewayApi();
  backgroundImageUrl: string = '';
  header?: HeaderComponent | HeaderMinimalComponent;
  matThemeOptions = DataUtils.getEnumMatOptions(MatTheme);

  constructor(
    protected objectStorageService: ObjectStorageService,
    protected matDialog: MatDialog,
    protected snackBar: MatSnackBar,
    protected router: Router,
    protected injector: Injector
  ) { }

  init() {
    this.prefix = environment.name;
    this.authenticatorService = this.injector.get(AuthenticatorService);

    this.subscribeToSubject();

    let setting = FileUtils.localStorageGetItem<T>(this.GENERAL_SETTING_KEY);

    if (setting) {
      this.generalSetting = setting;
    }
    else {
      this.generalSetting = this.newSetting();
    }

    this.applySetting();
    this.onGeneralSettingChangeSubject.next();
  }

  protected newSetting() {
    return new GeneralSetting() as T;
  }

  private subscribeToSubject() {
    this.unsubscribeToSubject();
    if(this.authenticatorService) {
      if(this.onLoginSubscription == null) {
        this.onLoginSubscription = this.authenticatorService.onLogin(
          () => {
            this.syncFromServer(this.prefix);
          }
        );
      }

      if(this.onTimeoutLogoutSubscription == null) {
        this.onTimeoutLogoutSubscription = this.authenticatorService.onTimeoutLogout(
          () => {
            if(this.generalSetting.promptLoginWhenTimeoutLogout)
              this.promptLoginWhenTimeoutLogout();
          }
        );
      }
    }
  }

  unsubscribeToSubject() {
    if(this.onLoginSubscription) {
      this.onLoginSubscription.unsubscribe();
    }
    if(this.onTimeoutLogoutSubscription) {
      this.onTimeoutLogoutSubscription.unsubscribe();
    }
  }

  syncFromServer(prefix: string) {
    this.objectStorageService.getFileByFileName(`${prefix}/${this.GENERAL_SETTING_KEY}`).pipe(RxJSUtils.waitLoadingDynamicStringSnackBar(this.snackBar, `Loading ${prefix}/${this.GENERAL_SETTING_KEY}`, 40, 'Dismiss', 10)).subscribe({
      next: (blob) => {
        StringUtils.readBlobAsText(blob).then((data) => {
          this.generalSetting = JSON.parse(data);
          this.onGeneralSettingChangeSubject.next();
          this.saveSettingLocally(this.generalSetting);
          this.applySetting();
        });
      },
      error: (error) => {
        if(!FileUtils.localStorageGetItem<T>(this.GENERAL_SETTING_KEY)) {
          this.generalSetting = this.newSetting();
          this.applySetting();
        }
      }
    });
  }

  applySetting() {
    this.generalSetting.theme = this.generalSetting.theme ? this.generalSetting.theme : MatTheme.CyanDeepPurpleLight;
    this.changeTheme(this.generalSetting.theme);
  }

  getCopyOfGeneralSetting<T>(): T {
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

  saveSettingLocally(generalSetting: T): void {
    FileUtils.localStorageSetItem(this.GENERAL_SETTING_KEY, generalSetting);
    this.generalSetting = generalSetting;
  }

  saveSettingToServer(prefix: string, generalSetting: T): void {
    this.saveSettingLocally(generalSetting);

    let vFile: VFile = {
      name: prefix + '/' + this.GENERAL_SETTING_KEY,
      type: 'application/json',
      extension: 'json',
      rawFile: new Blob([JSON.stringify(generalSetting)], {type: 'application/json'}),
      objectUrl: JSON.stringify(generalSetting)
    }

    this.objectStorageService.postOrPutFile(vFile, {type: PopupType.LOADING_DIALOG}).then((data) => {}).catch((error) => {
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
          this.router.navigate([environment.endpoint_login])
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

  loadBackgroundImage(url: string, objectStorage?: ObjectStorage, popupArgs?: PopupArgs, rememberInitialUrl: boolean = true) {
    let currentRoute = RouteUtils.getCurrentUrl();
    if(url.includes(ViesService.getGatewayApi()) && objectStorage) {
      objectStorage.fetchFileAndGenerateObjectUrl(url, popupArgs).then(res => {
        if(rememberInitialUrl && RouteUtils.getCurrentUrl() === currentRoute)
          this.backgroundImageUrl = res;
      })
    }
    else {
      this.backgroundImageUrl = url;
    }
  }
}
