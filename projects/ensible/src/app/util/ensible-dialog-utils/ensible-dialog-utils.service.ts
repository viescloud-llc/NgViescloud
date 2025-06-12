import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { UserAccess, SharedUser, SharedGroup, AccessPermission } from 'projects/viescloud-utils/src/lib/model/authenticator.model';
import { UserAccessInputType } from 'projects/viescloud-utils/src/lib/util-component/mat-form-field-input-user-access/mat-form-field-input-user-access.component';
import { UserGroupService } from 'projects/viescloud-utils/src/lib/service/user-group.service';
import { UserService } from 'projects/viescloud-utils/src/lib/service/user.service';

@Injectable({
  providedIn: 'root'
})
export class EnsibleDialogUtilsService extends DialogUtils {

  constructor(
    matDialog: MatDialog,
    private ensibleUserGroupService: UserGroupService,
    private ensibleUserService: UserService,
  ) {
    super(matDialog);
  }

  openEnsibleUserAccessDialog<T extends UserAccess | SharedUser[] | SharedGroup[] | AccessPermission[]>(value: T, inputType: UserAccessInputType[] | UserAccessInputType, readonly?: boolean, title?: string, yes?: string, no?: string, width?: string, disableClose?: boolean): Promise<T> {
    return super.openUserAccessDialog(
      value,
      inputType,
      this.ensibleUserService.getAllPublicUserIdOptions(),
      this.ensibleUserGroupService.getAllPublicGroupIdOptions(),
      readonly,
      title,
      yes,
      no,
      width,
      disableClose
    );
  }
}
