import { Injectable, Injector } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { GeneralSetting } from "projects/viescloud-utils/src/lib/model/setting.model";
import { AuthenticatorService } from "projects/viescloud-utils/src/lib/service/authenticator.service";
import { SettingService } from "projects/viescloud-utils/src/lib/service/setting.service";
import { FileUtils } from "projects/viescloud-utils/src/lib/util/File.utils";
import { SkeletonSetting } from "../model/skeleton.model";
import { ObjectStorageService } from "projects/viescloud-utils/src/lib/service/object-storage-manager.service";

@Injectable({
  providedIn: 'root'
})
export class SkeletonSettingService extends SettingService<SkeletonSetting> {

  constructor(
    objectStorageService: ObjectStorageService,
    matDialog: MatDialog,
    snackBar: MatSnackBar,
    router: Router,
    injector: Injector
  ) {
    super(objectStorageService, matDialog, snackBar, router, injector);
  }

  protected override newSetting(): SkeletonSetting {
    return new SkeletonSetting();
  }
}