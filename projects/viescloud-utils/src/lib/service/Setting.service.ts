import { Injectable, Renderer2 } from '@angular/core';
import { environment } from 'projects/environments/environment.prod';
import { DRAWER_STATE, HeaderComponent } from '../share-component/header/header.component';
import { S3StorageServiceV1 } from './ObjectStorageManager.service';
import { UtilsService, VFile } from './Utils.service';
import { GeneralSetting } from '../model/Setting.model';
import { MatDialog } from '@angular/material/dialog';
import { MatTheme } from '../model/theme.model';

@Injectable({
  providedIn: 'root'
})
export class SettingService {
  private GENERAL_SETTING_KEY = 'generalSetting.json';
  private generalSetting: GeneralSetting = new GeneralSetting();
  private matThemes = UtilsService.getEnumValues(MatTheme) as string[];
  
  prefix = '';
  currentMenu = "main";
  apiGatewayUrl: string = environment.gateway_api;
  backgroundImageUrl: string = '';
  header?: HeaderComponent;
  matThemeOptions = UtilsService.getEnumMatOptions(MatTheme);

  constructor(
    private s3StorageService: S3StorageServiceV1,
    private matDialog: MatDialog
  ) { }

  init(prefix: string) {
    this.prefix = prefix;
    let setting = UtilsService.localStorageGetItem<GeneralSetting>(this.GENERAL_SETTING_KEY);

    if (!setting) {
      this.s3StorageService.getFileByFileName(`${prefix}/${this.GENERAL_SETTING_KEY}`).pipe(UtilsService.waitLoadingDialog(this.matDialog)).subscribe({
        next: (blob) => {
          UtilsService.readBlobAsText(blob).then((data) => {
            this.generalSetting = JSON.parse(data);  
            this.applySetting();
          })
        }
      })
    }
    else {
      this.generalSetting = setting;
      this.applySetting();
    }
  }

  private applySetting() {
    this.generalSetting.theme = this.generalSetting.theme ? this.generalSetting.theme : MatTheme.CyanDeepPurpleLight;
    this.changeTheme(this.generalSetting.theme);
  }

  getCopyOfGeneralSetting(): GeneralSetting {
    return JSON.parse(JSON.stringify(this.generalSetting));
  }

  getGatewayUrl(): string {
    return this.apiGatewayUrl;
  }

  getDisplayHeader(): boolean {
    return this.generalSetting.displayHeader;
  }

  setDisplayHeader(value: boolean): void {
    this.generalSetting.displayHeader = value;
  }

  getDisplayDrawer(): boolean {
    return this.generalSetting.displayDrawer;
  }

  setDisplayDrawer(value: boolean): void {
    this.generalSetting.displayDrawer = value;
    if(this.header) {
      this.header.toggleDrawer(this.generalSetting.displayDrawer ? DRAWER_STATE.OPEN : DRAWER_STATE.CLOSE);
    }
  }

  toggleDisplayHeader(): void {
    this.generalSetting.displayDrawer = !this.generalSetting.displayDrawer;
  }

  toggleDisplayDrawer(): void {
    this.generalSetting.displayDrawer = !this.generalSetting.displayDrawer;
    if(this.header) {
      this.header.toggleDrawer(this.generalSetting.displayDrawer ? DRAWER_STATE.OPEN : DRAWER_STATE.CLOSE);
    }
  }

  saveSettingLocally(generalSetting: GeneralSetting): void {
    UtilsService.localStorageSetItem(this.GENERAL_SETTING_KEY, generalSetting);
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

    this.s3StorageService.putOrPostFile(vFile, false, this.matDialog).then((data) => {}).catch((error) => {
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
}
