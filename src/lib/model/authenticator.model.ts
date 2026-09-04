import { ReflectionUtils } from "../util/Reflection.utils";
import { MatColumn, MatInputDisable, MatInputHide, MatTableHide, MatTableDisplayLabel, MatInputItemSetting, MatInputRequire, MatItemSettingType } from "./mat.model";
import { ViesDateTime } from "./vies.model";

export enum AccessPermission {
    READ = "READ",
    WRITE = "WRITE",
    DELETE = "DELETE"
}

export class SharedUser {
  userId: string = '';
  permissions: AccessPermission[] = [AccessPermission.READ] as AccessPermission[];

  constructor(userId?: string, permissions?: AccessPermission[]) {
    this.userId = userId ?? '';
    this.permissions = permissions ?? [AccessPermission.READ] as AccessPermission[];
  }
}

export class SharedGroup {
  groupId: string = '';
  permissions: AccessPermission[] = [AccessPermission.READ] as AccessPermission[];

  constructor(groupId?: string, permissions?: AccessPermission[]) {
    this.groupId = groupId ?? '';
    this.permissions = permissions ?? [AccessPermission.READ] as AccessPermission[];
  }
}

export class UserAccess {
  @MatInputHide()
  @MatTableHide()
  ownerUserId: string = '';

  @MatInputHide()
  @MatTableHide()
  sharedUsers: SharedUser[] = [new SharedUser()] as SharedUser[];

  @MatInputHide()
  @MatTableHide()
  sharedGroups: SharedGroup[] = [new SharedGroup()] as SharedGroup[];

  @MatInputHide()
  @MatTableHide()
  sharedOthers: AccessPermission[] = [AccessPermission.READ] as AccessPermission[];

  constructor() {
    ReflectionUtils.copyAllParentPrototype(this, 10); //child extends this class don't need to copy
  }
}

/**
 * A named bundle of permission grants — the ONLY place grants live
 * (vies-spring-utils 6.4.0+). Assigned to users directly (User.roles) and/or
 * through groups (UserGroup.roles); effective permissions = the union.
 * `permissions` is a Set server-side, so wire order is arbitrary.
 */
export class Role {
    @MatInputDisable()
    @MatTableHide()
    id: string = '';

    @MatInputRequire()
    name: string = '';

    @MatInputItemSetting(MatItemSettingType.TEXT_AREA)
    description: string = '';

    // Edited by the dedicated permission editor, not the dynamic form.
    @MatInputHide()
    @MatTableDisplayLabel('Permissions', (r: Role) => (r.permissions ?? []).join(', '))
    permissions: string[] = [] as string[];
}

export class UserGroup {
    @MatInputDisable()
    id: string = '';

    @MatInputRequire()
    name: string = '';

    @MatInputItemSetting(MatItemSettingType.TEXT_AREA)
    description: string = '';

    // Roles every member inherits. Picked with a dedicated multi-select.
    @MatInputHide()
    @MatTableDisplayLabel('Roles', (g: UserGroup) => (g.roles ?? []).map(r => r.name).join(', '))
    roles: Role[] = [] as Role[];
}

export class User {
    @MatInputDisable()
    id: string = '';

    @MatInputDisable()
    sub: string = '';

    alias: string = '';

    @MatInputRequire()
    username: string = '';

    @MatInputRequire()
    email: string = '';

    @MatTableHide()
    @MatInputHide()
    password: string = '';

    @MatTableDisplayLabel('Groups', (user: User) => (user.userGroups ?? []).map(g => g.name).join(', '))
    @MatInputHide()
    userGroups: UserGroup[] = [
        new UserGroup(),
    ] as UserGroup[];

    // Directly-assigned roles (exception grants). Optional — [] default.
    @MatInputHide()
    @MatTableDisplayLabel('Roles', (user: User) => (user.roles ?? []).map(r => r.name).join(', '))
    roles: Role[] = [] as Role[];
}

