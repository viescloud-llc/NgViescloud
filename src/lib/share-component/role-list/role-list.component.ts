import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ViesMatFormFieldMap } from '../../abtract/ViesMatFormFieldMap';
import { Role } from '../../model/authenticator.model';
import { RoleService } from '../../service/role.service';
import { AuthenticatorService } from '../../service/authenticator.service';
import { ViesService } from '../../service/rest.service';
import { DialogUtils } from '../../util/Dialog.utils';
import { RxJSUtils } from '../../util/RxJS.utils';
import { DataUtils } from '../../util/Data.utils';

/**
 * Roles administration (authority resource `iam`): table of roles → editor
 * with name, description and the permission-chips editor. Same list+editor
 * shape as the user list. SUPER_ADMIN (the seeded `*` role the ADMIN group
 * rides on) cannot be deleted from here, and removing its `*` is warned about.
 *
 * After any save the signed-in user's own grants are re-fetched, since an
 * admin editing a role they hold changes what they may do next.
 */
@Component({
  selector: 'app-role-list',
  standalone: false,
  templateUrl: './role-list.component.html',
  styleUrls: ['./role-list.component.scss']
})
export class RoleListComponent extends ViesMatFormFieldMap implements OnInit {

  static readonly SUPER_ADMIN = 'SUPER_ADMIN';

  private roleService = inject(RoleService);
  private authenticatorService = inject(AuthenticatorService);
  private dialogUtils = inject(DialogUtils);
  private rxjs = inject(RxJSUtils);

  readonly blankRole = new Role();

  roles = signal<Role[]>([]);
  selected = signal<Role | null>(null);
  private baseline = signal<Role | null>(null);
  validForm = signal<boolean>(false);

  isSuperAdmin = computed<boolean>(() => this.selected()?.name === RoleListComponent.SUPER_ADMIN);
  isDirty = computed<boolean>(() => DataUtils.isNotEqual(this.canonical(this.selected()), this.canonical(this.baseline())));
  canSave = computed<boolean>(() => this.isDirty() && this.validForm() && !!this.selected()?.name?.trim());
  // Removing `*` from SUPER_ADMIN would lock every legacy admin out — flag it loudly.
  superAdminLosingStar = computed<boolean>(() =>
    this.isSuperAdmin() && !!this.baseline()?.permissions?.includes('*') && !this.selected()?.permissions?.includes('*')
  );

  ngOnInit(): void {
    if (ViesService.isNotCSR()) return;
    this.refresh();
  }

  refresh() {
    this.roleService.getAll().pipe(this.rxjs.waitLoadingDialog()).subscribe({
      next: res => this.roles.set([...(res ?? [])].sort((a, b) => a.name.localeCompare(b.name))),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  addRole() {
    const r = DataUtils.purgeValue(new Role());
    r.permissions = [];
    this.select(r);
  }

  select(role: Role) {
    const copy = structuredClone(role);
    copy.permissions = [...(copy.permissions ?? [])];
    this.selected.set(copy);
    this.baseline.set(structuredClone(copy));
  }

  back() {
    this.selected.set(null);
    this.baseline.set(null);
  }

  onFormChange(r: Role) {
    // Dynamic form mutates in place; keep the hidden permissions and force a new ref.
    r.permissions = this.selected()?.permissions ?? [];
    this.selected.set({ ...r });
  }

  onPermissionsChange(permissions: string[]) {
    const r = this.selected();
    if (!r) return;
    this.selected.set({ ...r, permissions: [...permissions] });
  }

  revert() {
    const b = this.baseline();
    if (b) this.selected.set(structuredClone(b));
  }

  async save() {
    const r = this.selected();
    if (!r || !this.canSave()) return;
    if (this.superAdminLosingStar()) {
      const ok = await this.dialogUtils.openConfirmDialog(
        'Remove * from SUPER_ADMIN?',
        'SUPER_ADMIN carries the ADMIN group\'s full access. Without "*" every legacy admin loses everything not granted elsewhere. Continue?',
        'Yes, remove it', 'Cancel').catch(() => false);
      if (!ok) return;
    }
    const call = r.id ? this.roleService.put(r.id, r) : this.roleService.post(r);
    call.pipe(this.rxjs.waitLoadingDialog()).subscribe({
      next: saved => {
        this.select(saved);
        this.refresh();
        this.authenticatorService.refreshCurrentUser();
      },
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  async remove() {
    const r = this.selected();
    if (!r?.id || this.isSuperAdmin()) return;
    const ok = await this.dialogUtils.openConfirmDialog(
      'Delete role?',
      `Delete "${r.name}"? Users and groups holding it lose its grants immediately.`,
      'Delete', 'Cancel').catch(() => false);
    if (!ok) return;
    this.roleService.delete(r.id).pipe(this.rxjs.waitLoadingDialog()).subscribe({
      next: () => { this.back(); this.refresh(); this.authenticatorService.refreshCurrentUser(); },
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  // Permissions are a Set server-side: compare order-insensitively.
  private canonical(r: Role | null): unknown {
    if (!r) return null;
    return { ...r, permissions: [...(r.permissions ?? [])].sort() };
  }
}
