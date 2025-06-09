import { Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { EnsibleSetting } from "projects/ensible/src/app/model/ensible.setting.model";
import { EnsibleAuthenticatorService } from "projects/ensible/src/app/service/ensible-authenticator/ensible-authenticator.service";
import { S3StorageServiceV1 } from "projects/viescloud-utils/src/lib/service/ObjectStorageManager.service";
import { OpenIdService } from "projects/viescloud-utils/src/lib/service/OpenId.service";
import { SettingService } from "projects/viescloud-utils/src/lib/service/Setting.service";
import { FileUtils } from "projects/viescloud-utils/src/lib/util/File.utils";

@Injectable({
  providedIn: 'root'
})
export class DnsManagerSettingService extends SettingService {

  onLoginSubscribe: any = null;
  isEditing: boolean = false;

  constructor(
    s3StorageService: S3StorageServiceV1,
    matDialog: MatDialog,
    snackBar: MatSnackBar,
    openIdService: OpenIdService,
    private ensibleAuthenticatorService: EnsibleAuthenticatorService
  ) {
    super(s3StorageService, matDialog, snackBar, openIdService);
  }

  override initMinimal(prefix: string): void {

    if(!this.onLoginSubscribe) {
      this.ensibleAuthenticatorService.onLogin$.subscribe({
        next: () => {
          if(this.generalSetting.initAutoFetchGeneralSetting) {
            this.syncFromServer(prefix);
            this.onGeneralSettingChangeSubject.next();
          }
        }
      })
    }

    this.prefix = prefix;

    let setting = FileUtils.localStorageGetItem<EnsibleSetting>(this.GENERAL_SETTING_KEY);

    if (setting) {
      this.generalSetting = setting;
    }
    else {
      this.generalSetting = this.newSetting();
    }

    this.applySetting();
    this.onGeneralSettingChangeSubject.next();
  }

  protected override newSetting(): EnsibleSetting {
    return new EnsibleSetting();
  }
}