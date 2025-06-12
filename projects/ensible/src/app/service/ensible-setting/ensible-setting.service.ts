import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { S3StorageServiceV1 } from 'projects/viescloud-utils/src/lib/service/object-storage-manager.service';
import { SettingService } from 'projects/viescloud-utils/src/lib/service/setting.service';
import { FileUtils } from 'projects/viescloud-utils/src/lib/util/File.utils';
import { EnsibleSetting } from '../../model/ensible.setting.model';
import { AuthenticatorService } from 'projects/viescloud-utils/src/lib/service/authenticator.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class EnsibleSettingService extends SettingService {

  onLoginSubscribe: any = null;
  isEditing: boolean = false;

  constructor(
    s3StorageService: S3StorageServiceV1,
    matDialog: MatDialog,
    snackBar: MatSnackBar,
    router: Router,
    private ensibleAuthenticatorService: AuthenticatorService
  ) {
    super(s3StorageService, matDialog, snackBar, router);
  }

  override initMinimal(prefix: string): void {

    if(!this.onLoginSubscribe) {
      this.ensibleAuthenticatorService.onLogin(user => {
        if(this.generalSetting.initAutoFetchGeneralSetting) {
          this.syncFromServer(prefix);
          this.onGeneralSettingChangeSubject.next();
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
