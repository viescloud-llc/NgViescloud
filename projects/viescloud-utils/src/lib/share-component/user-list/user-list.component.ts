import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { Component, OnInit } from '@angular/core';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/mat.model';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { User, UserGroup } from '../../model/authenticator.model';
import { UserGroupService } from '../../service/user-group.service';
import { UserService } from '../../service/user.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  blankUser = new User();
  userGroups: UserGroup[] = [];
  blankUserGroup = new UserGroup();
  userGroupsOptions: MatOption<UserGroup>[] = [];

  selectedUser?: User;
  selectedUserCopy?: User;

  validForm = false;

  constructor(
    private userUserService: UserService,
    private userGroupService: UserGroupService,
    private rxjs: RxJSUtils,
    private dialogUtils: DialogUtils
  ) { }

  ngOnInit(): void {
    this.selectedUser = undefined;
    this.selectedUserCopy = undefined;

    this.userUserService.getAll().pipe(this.rxjs.waitLoadingDialog()).subscribe({
      next: res => {
        this.users = res;
      }
    })

    this.fetchUserGroups();
  }

  private fetchUserGroups() {
    this.userGroupService.getAll().pipe(this.rxjs.waitLoadingDialog()).subscribe({
      next: res => {
        this.userGroups = res;
        this.userGroupsOptions = [];
        this.userGroups.forEach(userGroup => {
          this.userGroupsOptions.push({
            value: userGroup,
            valueLabel: userGroup.name
          });
        });
      }
    });
  }

  addUser() {
    this.selectedUser = new User();
    this.selectedUserCopy = structuredClone(this.selectedUser);
  }

  selectUser(user: User) {
    this.selectedUser = user;
    this.selectedUserCopy = structuredClone(user);
  }

  isValueChange() {
    return DataUtils.isNotEqual(this.selectedUser, this.selectedUserCopy);
  }

  revert() {
    this.selectedUser = structuredClone(this.selectedUserCopy);
  }

  save() {
    if(this.selectedUser) {
      this.userUserService.postOrPatch(this.selectedUser?.id, this.selectedUser).subscribe({
        next: res => {
          this.ngOnInit();
        },
        error: err => {
          this.dialogUtils.openErrorMessageFromError(err);
        }
      })
    }
  }

  addUserGroup() {
    this.userGroupService.openDialog(this.dialogUtils.matDialog, 0, this.blankUserGroup).subscribe({
      next: res => {
        this.fetchUserGroups();
      }
    });
  }
}
