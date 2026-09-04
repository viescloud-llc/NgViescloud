import { Role, User } from '../model/authenticator.model';

/**
 * Permission-string grammar — a faithful port of the backend's
 * PermissionStrings (vies-spring-utils/util/PermissionStrings.java). The
 * grammar is FROZEN server-side; keep this in lock-step:
 *
 *  - 1–3 colon-separated segments; each segment [a-z0-9-]+ or a whole `*`.
 *  - GRANTS (stored on roles) may contain `*`; CHECKS (what code asks for)
 *    are always concrete.
 *  - Matching is RIGHT-ALIGNED: a grant shorter than the check is left-padded
 *    with `*` ("orders:read" matches "store1:orders:read"); a grant longer than
 *    the check never matches; `*` matches everything.
 *
 * SECURITY NOTE: everything here only shapes the UI (nav, routes, buttons).
 * The server re-checks every request — never rely on these results for
 * security decisions.
 */
export class PermissionStrings {
  static readonly MAX_SEGMENTS = 3;
  private static readonly SEGMENT = /^[a-z0-9-]+$/;

  /** True when `grant` (may hold whole-segment wildcards) covers the concrete `check`. */
  static matches(grant: string | null | undefined, check: string | null | undefined): boolean {
    if (!grant || !check) return false;
    const g = grant.trim().split(':');
    const c = check.trim().split(':');
    if (g.length > c.length) return false;
    for (let i = 1; i <= c.length; i++) {
      const checkSeg = c[c.length - i];
      const grantSeg = i <= g.length ? g[g.length - i] : '*';
      if (grantSeg !== '*' && grantSeg !== checkSeg) return false;
    }
    return true;
  }

  static anyMatches(grants: readonly string[] | null | undefined, check: string): boolean {
    return !!grants && grants.some(g => PermissionStrings.matches(g, check));
  }

  static isValidGrant(grant: string | null | undefined): boolean {
    return PermissionStrings.isValid(grant, true);
  }

  static isValidCheck(check: string | null | undefined): boolean {
    return PermissionStrings.isValid(check, false);
  }

  /** Trim + lowercase; returns null when the result is not a valid grant. */
  static normalizeGrant(grant: string | null | undefined): string | null {
    const normalized = (grant ?? '').trim().toLowerCase();
    return PermissionStrings.isValidGrant(normalized) ? normalized : null;
  }

  /** Human explanation of why a grant is invalid (null when it is valid). Mirrors the server's 400 message. */
  static explainInvalidGrant(grant: string): string | null {
    const raw = (grant ?? '').trim();
    if (!raw) return 'Permission cannot be empty';
    const segments = raw.split(':');
    if (segments.length > PermissionStrings.MAX_SEGMENTS) return `At most ${PermissionStrings.MAX_SEGMENTS} segments (resource:action)`;
    for (const seg of segments) {
      if (seg === '') return 'Empty segment — expected resource:action (no leading/trailing colon)';
      if (seg === '*') continue;
      if (seg.includes('*')) return `"${seg}": * must be a whole segment (shipments:*), not a partial wildcard`;
      if (/[A-Z]/.test(seg)) return `"${seg}": use lowercase`;
      if (/[._ ]/.test(seg)) return `"${seg}": dots, underscores and spaces are not allowed — use resource:action (e.g. product:read)`;
      if (!PermissionStrings.SEGMENT.test(seg)) return `"${seg}": only a-z, 0-9 and - are allowed`;
    }
    return null;
  }

  private static isValid(permission: string | null | undefined, wildcardAllowed: boolean): boolean {
    if (!permission || !permission.trim()) return false;
    const segments = permission.trim().split(':');
    if (segments.length < 1 || segments.length > PermissionStrings.MAX_SEGMENTS) return false;
    return segments.every(seg => PermissionStrings.SEGMENT.test(seg) || (wildcardAllowed && seg === '*'));
  }
}

/** One effective grant with where it came from — same shape as the backend's EffectivePermission record. */
export interface EffectivePermission {
  permission: string;
  roleName: string;
  /** 'direct' for a directly-assigned role, or 'group:<name>' when inherited through a group. */
  via: string;
}

/** Client-side resolution over a User object (roles ∪ userGroups[*].roles). */
export class PermissionUtils {

  /** Grants with provenance, in a stable order: direct roles first, then groups. Tolerates older backends (missing arrays). */
  static effectivePermissionsWithProvenance(user: User | null | undefined): EffectivePermission[] {
    const out: EffectivePermission[] = [];
    if (!user) return out;
    for (const role of user.roles ?? []) {
      PermissionUtils.addGrants(out, role, 'direct');
    }
    for (const group of user.userGroups ?? []) {
      for (const role of group?.roles ?? []) {
        PermissionUtils.addGrants(out, role, `group:${group.name}`);
      }
    }
    return out;
  }

  /** Deduplicated, sorted grant strings. */
  static effectivePermissions(user: User | null | undefined): string[] {
    const set = new Set<string>();
    for (const ep of PermissionUtils.effectivePermissionsWithProvenance(user)) set.add(ep.permission);
    return [...set].sort();
  }

  /** Every role the user holds (direct + via groups), deduplicated by name. */
  static rolesOf(user: User | null | undefined): Role[] {
    const byName = new Map<string, Role>();
    if (!user) return [];
    for (const role of user.roles ?? []) if (role?.name) byName.set(role.name, role);
    for (const group of user.userGroups ?? []) for (const role of group?.roles ?? []) if (role?.name && !byName.has(role.name)) byName.set(role.name, role);
    return [...byName.values()];
  }

  private static addGrants(out: EffectivePermission[], role: Role | null | undefined, via: string) {
    if (!role?.permissions) return;
    for (const permission of role.permissions) {
      if (permission) out.push({ permission, roleName: role.name, via });
    }
  }
}
