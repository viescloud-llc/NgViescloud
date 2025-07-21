import { Injectable, Injector } from '@angular/core';
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
import { Router } from '@angular/router';
import { ViesService } from './rest.service';
import { environment } from '../../environments/environment.prod';
import DynamicJsonObject from '../model/dynamic-json-object.model';

@Injectable({
  providedIn: 'root'
})
export class SettingService {
  protected GENERAL_SETTING_KEY = 'generalSetting.json';
  DEFAULT_GENERAL_SETTING_PATHS = {
    initalDisplayDrawer: ['general', 'initalDisplayDrawer'],
    displayDrawer: ['general', 'displayDrawer'],
    initalDisplayHeader: ['general', 'initalDisplayHeader'],
    displayHeader: ['general', 'displayHeader'],
    initalAutoFetchGeneralSetting: ['general', 'initalAutoFetchGeneralSetting'],
    promptLoginWhenTimeoutLogout: ['general', 'promptLoginWhenTimeoutLogout'],
    backgroundImageUrl: ['general', 'backgroundImageUrl'],
    theme: ['general', 'theme']
  };
  
  applicationSetting: DynamicJsonObject = new DynamicJsonObject();

  protected matThemes = DataUtils.getEnumValues(MatTheme) as string[];
  protected authenticatorService: AuthenticatorService | undefined;

  protected onLoginSubscription: any = null;
  protected onTimeoutLogoutSubscription: any = null;

  protected onGeneralSettingChangeSubject = new Subject<void>();
  onGeneralSettingChange = this.onGeneralSettingChangeSubject.asObservable();

  prefix = '';
  currentMenu = "main";
  apiGatewayUrl: string = ViesService.getGatewayApi();
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

    let setting = FileUtils.localStorageGetItem<string>(this.GENERAL_SETTING_KEY);

    if (setting) {
      this.applicationSetting.fromJson(setting);
    }

    this.applySetting();
    this.onGeneralSettingChangeSubject.next();
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
            if(this.applicationSetting.get<boolean>('primitive', ...this.DEFAULT_GENERAL_SETTING_PATHS.promptLoginWhenTimeoutLogout))
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
          this.applicationSetting.fromJson(data);
          this.onGeneralSettingChangeSubject.next();
          this.saveSettingLocally(this.applicationSetting);
          this.applySetting();
        });
      },
      error: (error) => {
        if(!FileUtils.localStorageGetItem<string>(this.GENERAL_SETTING_KEY)) {
          this.applySetting();
        }
      }
    });
  }

  getCurrentTheme() {
    return this.applicationSetting.get<MatTheme>('anything', ...this.DEFAULT_GENERAL_SETTING_PATHS.theme) ?? MatTheme.IndigoPinkLight;
  }

  applySetting() {
    this.changeTheme(this.getCurrentTheme());
  }

  saveSettingLocally(applicationSetting?: DynamicJsonObject): void {
    if(!applicationSetting) {
      applicationSetting = this.applicationSetting;
    }

    FileUtils.localStorageSetItem(this.GENERAL_SETTING_KEY, applicationSetting.toJson());
    this.applicationSetting.fromJson(applicationSetting.toJson());
  }

  saveSettingToServer(prefix: string, applicationSetting?: DynamicJsonObject): void {
    if(!applicationSetting) {
      applicationSetting = this.applicationSetting;
    }

    this.saveSettingLocally(applicationSetting);

    let vFile: VFile = {
      name: prefix + '/' + this.GENERAL_SETTING_KEY,
      type: 'application/json',
      extension: 'json',
      rawFile: new Blob([JSON.stringify(applicationSetting.toJson())], {type: 'application/json'}),
      objectUrl: applicationSetting.toJson()
    }

    this.objectStorageService.postOrPutFile(vFile, {type: PopupType.LOADING_DIALOG}).then((data) => {}).catch((error) => {
      window.alert(error);
    });
  }

  changeTheme(matTheme: MatTheme) {
    if(ViesService.isNotCSR()) {
      return;
    }

    // Remove any previous theme class from the body
    document.body.classList.remove(... this.matThemes);

    // Add the selected theme class
    document.body.classList.add(matTheme);
  }

  changeToCurrentTheme() {
    let theme = this.getCurrentTheme();
    this.changeTheme(theme);
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
    let theme = this.getCurrentTheme();
    if(theme.toLowerCase().includes('light'))
      return 'black';
    else
      return 'white';
  }

  loadBackgroundImage(url: string, popupArgs?: PopupArgs) {
    let currentRoute = RouteUtils.getCurrentUrl();
    this.objectStorageService.fetchFileAndGenerateObjectUrl(url, popupArgs).then(res => {
      this.applicationSetting.set(res, ...this.DEFAULT_GENERAL_SETTING_PATHS.backgroundImageUrl);
    })
  }
}
