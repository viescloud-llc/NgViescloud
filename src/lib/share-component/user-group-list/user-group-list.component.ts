import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ViesMatFormFieldMap } from '../../abtract/ViesMatFormFieldMap';
import { MatOption } from '../../model/mat.model';
import { Role, UserGroup } from '../../model/authenticator.model';
import { UserGroupService } from '../../service/user-group.service';
import { RoleService } from '../../service/role.service';
import { AuthenticatorService } from '../../service/authenticator.service';
import { ViesService } from '../../service/rest.service';
import { DialogUtils } from '../../util/Dialog.utils';
import { RxJSUtils } from '../../util/RxJS.utils';
import { DataUtils } from '../../util/Data.utils';

/**
 * User-group administration (authority resource `iam`). Was an inline dynamic
 * table; now list → editor so a group can carry ROLES (every member inherits
 * them). Name/description via the dynamic form, roles via a multi-select.
 * The seeded ADMIN/NORMAL/GUESS groups are protected from deletion.
 */
@Component({
  selector: 'app-user-group-list',
  templateUrl: './user-group-list.component.html',
  styleUrls: ['./user-group-list.component.scss'],
  standalone: false
})
export class UserGroupListComponent extends ViesMatFormFieldMap implements OnInit {

  static readonly PROTECTED_GROUPS = ['ADMIN', 'NORMAL', 'GUESS'];

  private userGroupService = inject(UserGroupService);
  private roleService = inject(RoleService);
  private authenticatorService = inject(AuthenticatorService);
  private dialogUtils = inject(DialogUtils);
  private rxjs = inject(RxJSUtils);

  readonly blankUserGroup = new UserGroup();

  groups = signal<UserGroup[]>([]);
  roleOptions = signal<MatOption<Role>[]>([]);
  selected = signal<UserGroup | null>(null);
  private baseline = signal<UserGroup | null>(null);
  validForm = signal<boolean>(false);

  isProtected = computed<boolean>(() => UserGroupListComponent.PROTECTED_GROUPS.includes(this.selected()?.name ?? ''));
  isDirty = computed<boolean>(() => DataUtils.isNotEqual(this.selected(), this.baseline()));
  canSave = computed<boolean>(() => this.isDirty() && this.validForm() && !!this.selected()?.name?.trim());

  ngOnInit(): void {
    if (ViesService.isNotCSR()) return;
    this.refresh();
    this.roleService.getAll().subscribe({
      next: res => this.roleOptions.set((res ?? [])
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(r => ({ value: r, valueLabel: r.name + (r.permissions?.length ? ` — ${r.permissions.join(', ')}` : '') }))),
      error: () => this.roleOptions.set([])
    });
  }

  refresh() {
    this.userGroupService.getAll().pipe(this.rxjs.waitLoadingDialog()).subscribe({
      next: res => this.groups.set([...(res ?? [])].sort((a, b) => a.name.localeCompare(b.name))),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  addGroup() {
    const g = DataUtils.purgeValue(new UserGroup());
    g.roles = [];
    this.select(g);
  }

  select(group: UserGroup) {
    const copy = structuredClone(group);
    if (!copy.roles) copy.roles = [];
    this.selected.set(copy);
    this.baseline.set(structuredClone(copy));
  }

  back() {
    this.selected.set(null);
    this.baseline.set(null);
  }

  onFormChange(g: UserGroup) {
    g.roles = this.selected()?.roles ?? [];
    this.selected.set({ ...g });
  }

  onRolesChange(roles: Role[]) {
    const g = this.selected();
    if (!g) return;
    this.selected.set({ ...g, roles: roles ?? [] });
  }

  revert() {
    const b = this.baseline();
    if (b) this.selected.set(structuredClone(b));
  }

  save() {
    const g = this.selected();
    if (!g || !this.canSave()) return;
    this.userGroupService.postOrPut(g.id, g).pipe(this.rxjs.waitLoadingDialog()).subscribe({
      next: saved => {
        this.select(saved);
        this.refresh();
        this.authenticatorService.refreshCurrentUser(); // my own group may have changed roles
      },
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  async remove() {
    const g = this.selected();
    if (!g?.id || this.isProtected()) return;
    const ok = await this.dialogUtils.openConfirmDialog(
      'Delete user group?', `Delete "${g.name}"? Members lose every role this group carried.`,
      'Delete', 'Cancel').catch(() => false);
    if (!ok) return;
    this.userGroupService.delete(g.id).pipe(this.rxjs.waitLoadingDialog()).subscribe({
      next: () => { this.back(); this.refresh(); this.authenticatorService.refreshCurrentUser(); },
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
}
