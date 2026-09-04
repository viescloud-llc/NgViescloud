import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { User } from '../../model/authenticator.model';
import { RoleService } from '../../service/role.service';
import { EffectivePermission, PermissionUtils } from '../../util/Permission.utils';

export interface EffectivePermissionsDialogData {
  /** The user as currently shown in the editor (may hold unsaved role/group changes). */
  user: User;
  /** True when the editor has unsaved changes — the dialog then shows both views. */
  unsaved?: boolean;
}

/**
 * "Why can this user do X?" — every grant the user holds with the role that
 * carries it and the path it arrived by (direct assignment or a group).
 * Server view = the persisted truth (GET /roles/effective/{id});
 * preview = computed client-side from the editor's current, possibly unsaved,
 * roles and groups.
 */
@Component({
  selector: 'app-effective-permissions-dialog',
  standalone: false,
  templateUrl: './effective-permissions-dialog.component.html',
  styleUrls: ['./effective-permissions-dialog.component.scss']
})
export class EffectivePermissionsDialog implements OnInit {

  readonly data = inject<EffectivePermissionsDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<EffectivePermissionsDialog>);
  private roleService = inject(RoleService);

  serverRows = signal<EffectivePermission[] | null>(null);
  serverError = signal<string | null>(null);

  previewRows = computed<EffectivePermission[]>(() => PermissionUtils.effectivePermissionsWithProvenance(this.data.user));

  serverDistinct = computed<string[]>(() => this.distinct(this.serverRows() ?? []));
  previewDistinct = computed<string[]>(() => this.distinct(this.previewRows()));

  hasStar = computed<boolean>(() => (this.serverDistinct().includes('*')) || this.previewDistinct().includes('*'));

  ngOnInit(): void {
    if (!this.data.user?.id) {
      this.serverRows.set([]);
      return;
    }
    this.roleService.getEffectivePermissions(this.data.user.id).subscribe({
      next: rows => this.serverRows.set(rows ?? []),
      error: err => this.serverError.set(err?.error?.reason || err?.message || 'Could not load from server')
    });
  }

  close() {
    this.dialogRef.close();
  }

  private distinct(rows: EffectivePermission[]): string[] {
    return [...new Set(rows.map(r => r.permission))].sort();
  }
}
