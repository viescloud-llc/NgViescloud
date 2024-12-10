import { EnsibleUserGroupService } from './../service/ensible-user-group/ensible-user-group.service';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { Component, OnInit } from '@angular/core';
import { EnsibleAuthenticatorService } from '../service/ensible-authenticator/ensible-authenticator.service';
import { EnsibleUserService } from '../service/ensible-user/ensible-user.service';
import { EnsibleUser, EnsibleUserGroup } from '../model/ensible.model';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/Mat.model';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';

@Component({
  selector: 'app-ensible-user',
  templateUrl: './ensible-user.component.html',
  styleUrls: ['./ensible-user.component.scss']
})
export class EnsibleUserComponent implements OnInit {
  users: EnsibleUser[] = [];
  blankUser = new EnsibleUser();
  userGroups: EnsibleUserGroup[] = [];
  blankUserGroup = new EnsibleUserGroup();
  userGroupsOptions: MatOption<EnsibleUserGroup>[] = [];

  selectedUser?: EnsibleUser;
  selectedUserCopy?: EnsibleUser;

  validForm = false;

  constructor(
    private ensibleUserService: EnsibleUserService,
    private ensibleUserGroupService: EnsibleUserGroupService,
    private rxjs: RxJSUtils,
    private dialogUtils: DialogUtils
  ) { }

  ngOnInit(): void {
    this.selectedUser = undefined;
    this.selectedUserCopy = undefined;

    this.ensibleUserService.getAll().pipe(this.rxjs.waitLoadingDialog()).subscribe({
      next: res => {
        this.users = res;
      }
    })

    this.fetchUserGroups();
  }

  private fetchUserGroups() {
    this.ensibleUserGroupService.getAll().pipe(this.rxjs.waitLoadingDialog()).subscribe({
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
    this.selectedUser = new EnsibleUser();
    this.selectedUserCopy = structuredClone(this.selectedUser);
  }

  selectUser(user: EnsibleUser) {
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
      this.ensibleUserService.postOrPatch(this.selectedUser?.id, this.selectedUser).subscribe({
        next: res => {
          this.ngOnInit();
        }
      })
    }
  }

  addUserGroup() {
    this.ensibleUserGroupService.openDialog(this.dialogUtils.matDialog, 0, this.blankUserGroup).subscribe({
      next: res => {
        this.fetchUserGroups();
      }
    });
  }
}
