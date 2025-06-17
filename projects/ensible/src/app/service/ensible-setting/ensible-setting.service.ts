import { Injectable, Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ObjectStorageService } from 'projects/viescloud-utils/src/lib/service/object-storage-manager.service';
import { SettingService } from 'projects/viescloud-utils/src/lib/service/setting.service';
import { FileUtils } from 'projects/viescloud-utils/src/lib/util/File.utils';
import { EnsibleSetting } from '../../model/ensible.setting.model';
import { AuthenticatorService } from 'projects/viescloud-utils/src/lib/service/authenticator.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class EnsibleSettingService extends SettingService<EnsibleSetting> {

  onLoginSubscribe: any = null;
  isEditing: boolean = false;

  constructor(
    objectStorageService: ObjectStorageService,
    matDialog: MatDialog,
    snackBar: MatSnackBar,
    router: Router,
    injector: Injector
  ) {
    super(objectStorageService, matDialog, snackBar, router, injector);
  }

  protected override newSetting(): EnsibleSetting {
    return new EnsibleSetting();
  }
}
