import { DialogUtils } from '../../util/Dialog.utils';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RxJSUtils } from '../../util/RxJS.utils';
import { MatOption } from '../../model/mat.model';
import { DataUtils } from '../../util/Data.utils';
import { Role, User, UserGroup } from '../../model/authenticator.model';
import { UserGroupService } from '../../service/user-group.service';
import { UserService } from '../../service/user.service';
import { RoleService } from '../../service/role.service';
import { AuthenticatorService } from '../../service/authenticator.service';
import { ViesMatFormFieldMap } from '../../abtract/ViesMatFormFieldMap';
import { EffectivePermissionsDialog, EffectivePermissionsDialogData } from '../../dialog/effective-permissions-dialog/effective-permissions-dialog.component';

/**
 * Users administration (authority resource `iam`): list → editor with the
 * dynamic form (username/email/alias), password, group membership, and — since
 * 6.4.0 — directly-assigned roles plus an "Effective permissions" viewer that
 * explains every grant the user ends up with (server truth + unsaved preview).
 */
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  standalone: false
})
export class UserListComponent extends ViesMatFormFieldMap implements OnInit {
  private userUserService = inject(UserService);
  private userGroupService = inject(UserGroupService);
  private roleService = inject(RoleService);
  private authenticatorService = inject(AuthenticatorService);
  private rxjs = inject(RxJSUtils);
  private dialogUtils = inject(DialogUtils);

  users = signal<User[]>([]);
  blankUser = new User();
  userGroups = signal<UserGroup[]>([]);
  blankUserGroup = new UserGroup();
  userGroupsOptions = signal<MatOption<UserGroup>[]>([]);
  roleOptions = signal<MatOption<Role>[]>([]);

  selectedUser?: User;
  selectedUserCopy?: User;

  validForm = false;

  ngOnInit(): void {
    this.selectedUser = undefined;
    this.selectedUserCopy = undefined;

    this.userUserService.getAll().pipe(this.rxjs.waitLoadingDialog()).subscribe({
      next: res => this.users.set(res ?? [])
    });

    this.fetchUserGroups();
    this.fetchRoles();
  }

  private fetchUserGroups() {
    this.userGroupService.getAll().pipe(this.rxjs.waitLoadingDialog()).subscribe({
      next: res => {
        this.userGroups.set(res ?? []);
        this.userGroupsOptions.set(this.userGroups().map(g => ({ value: g, valueLabel: g.name })));
      }
    });
  }

  private fetchRoles() {
    this.roleService.getAll().subscribe({
      next: res => this.roleOptions.set((res ?? [])
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(r => ({ value: r, valueLabel: r.name + (r.permissions?.length ? ` — ${r.permissions.join(', ')}` : '') }))),
      error: () => this.roleOptions.set([]) // older backend without roles: picker just stays empty
    });
  }

  addUser() {
    this.selectedUser = new User();
    this.selectedUser.roles = [];
    this.selectedUserCopy = structuredClone(this.selectedUser);
  }

  selectUser(user: User) {
    // Never mutate the table row: edit a copy, keep a baseline for dirty-tracking.
    this.selectedUser = structuredClone(user);
    if (!this.selectedUser.roles) this.selectedUser.roles = [];
    if (!this.selectedUser.userGroups) this.selectedUser.userGroups = [];
    this.selectedUserCopy = structuredClone(this.selectedUser);
  }

  isValueChange() {
    return DataUtils.isNotEqual(this.selectedUser, this.selectedUserCopy);
  }

  revert() {
    this.selectedUser = structuredClone(this.selectedUserCopy);
  }

  save() {
    if(!this.selectedUser) return;
    const editingSelf = this.authenticatorService.currentUser?.id === this.selectedUser.id;
    this.userUserService.postOrPatch(this.selectedUser.id, this.selectedUser).pipe(this.rxjs.waitLoadingDialog()).subscribe({
      next: () => {
        this.ngOnInit();
        if (editingSelf) this.authenticatorService.refreshCurrentUser();
      },
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  addUserGroup() {
    this.userGroupService.openDialog(this.dialogUtils.matDialog, '', this.blankUserGroup).subscribe({
      next: () => this.fetchUserGroups()
    });
  }

  /** "Why can this user do X" — server truth, plus a preview when the editor has unsaved changes. */
  showEffectivePermissions() {
    if (!this.selectedUser) return;
    this.dialogUtils.matDialog.open(EffectivePermissionsDialog, {
      width: '720px',
      data: { user: this.selectedUser, unsaved: this.isValueChange() || !this.selectedUser.id } satisfies EffectivePermissionsDialogData
    });
  }
}
