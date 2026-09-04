import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesRestService, ViesService } from './rest.service';
import { Role } from '../model/authenticator.model';
import { EffectivePermission } from '../util/Permission.utils';

/**
 * CRUD over roles (/api/v1/roles — authority resource `iam`) plus the
 * server-side provenance lookup. Server-owned rules to remember: `name` is
 * unique; `permissions` are validated against the grammar and normalized
 * (trim/lowercase) on write — an invalid string is a 400 naming it.
 */
@Injectable({ providedIn: 'root' })
export class RoleService extends ViesRestService<Role> {
  private http = inject(HttpClient);

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'roles'];
  }

  override newBlankObject(): Role {
    return new Role();
  }
  override getIdFieldValue(object: Role) {
    return object.id;
  }
  override setIdFieldValue(object: Role, id: any): void {
    object.id = id;
  }

  /** "Why can this user do X" — the persisted union with provenance (gated iam:read). */
  getEffectivePermissions(userId: string): Observable<EffectivePermission[]> {
    return this.http.get<EffectivePermission[]>(`${ViesService.getUri()}/api/v1/roles/effective/${userId}`);
  }
}
