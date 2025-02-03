import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { EnsibleUserGroupService } from '../../service/ensible-user-group/ensible-user-group.service';
import { EnsibleUserService } from '../../service/ensible-user/ensible-user.service';
import { UserAccess, SharedUser, SharedGroup, AccessPermission } from 'projects/viescloud-utils/src/lib/model/Authenticator.model';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/Mat.model';
import { UserAccessInputType } from 'projects/viescloud-utils/src/lib/util-component/mat-form-field-input-user-access/mat-form-field-input-user-access.component';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EnsibleDialogUtilsService extends DialogUtils {

  constructor(
    matDialog: MatDialog,
    private ensibleUserGroupService: EnsibleUserGroupService,
    private ensibleUserService: EnsibleUserService,
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
