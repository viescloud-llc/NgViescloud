import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RxJSUtils } from '../../util/RxJS.utils';
import { MatFormFieldInputUserAccessComponent } from '../../util-component/mat-form-field-input-user-access/mat-form-field-input-user-access.component';
import { UserAccess, SharedUser, SharedGroup, AccessPermission } from '../../model/authenticator.model';
import { DialogUtils } from '../../util/Dialog.utils';
import { UserGroupService } from '../../service/user-group.service';
import { UserService } from '../../service/user.service';

@Component({
  selector: 'app-user-access',
  templateUrl: '../../util-component/mat-form-field-input-user-access/mat-form-field-input-user-access.component.html',
  styleUrls: ['../../util-component/mat-form-field-input-user-access/mat-form-field-input-user-access.component.scss'],
  standalone: false
})
export class UserAccessComponent<T extends UserAccess | SharedUser[] | SharedGroup[] | AccessPermission[]> extends MatFormFieldInputUserAccessComponent<T> {

  constructor(
    private userGroupService: UserGroupService,
    private userService: UserService,
    private rxjsUtils: RxJSUtils,
    cd: ChangeDetectorRef,
    dialogUtils: DialogUtils
  ) {
    super(cd, dialogUtils);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.userGroupService.getAllPublicGroupIdOptions().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.groupIdOptions = res;
      }
    })

    this.userService.getAllPublicUserIdOptions().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.userIdOptions = res;
      }
    })
  }
}
