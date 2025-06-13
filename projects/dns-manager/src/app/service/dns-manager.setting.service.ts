import { Injectable, Injector } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { ObjectStorageService } from "projects/viescloud-utils/src/lib/service/object-storage-manager.service";
import { SettingService } from "projects/viescloud-utils/src/lib/service/setting.service";
import { FileUtils } from "projects/viescloud-utils/src/lib/util/File.utils";
import { DnsManagerSetting } from "../model/dns-manager.setting.model";

@Injectable({
  providedIn: 'root'
})
export class DnsManagerSettingService extends SettingService<DnsManagerSetting> {

  onLoginSubscribe: any = null;
  isEditing: boolean = false;

  constructor(
    s3StorageService: ObjectStorageService,
    matDialog: MatDialog,
    snackBar: MatSnackBar,
    router: Router,
    injector: Injector
  ) {
    super(s3StorageService, matDialog, snackBar, router, injector);
  }

  protected override newSetting(): DnsManagerSetting {
    return new DnsManagerSetting();
  }
}