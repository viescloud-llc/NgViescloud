import { ReflectionUtils } from "../util/Reflection.utils";
import { MatColumn, MatInputDisable, MatInputHide, MatTableHide, MatTableDisplayLabel, MatInputItemSetting, MatInputRequire, MatItemSettingType } from "./mat.model";
import { DateTime } from "./vies.model";

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

export class UserGroup {
    @MatInputDisable()
    id: number = 0;

    @MatInputRequire()
    name: string = '';

    @MatInputItemSetting(MatItemSettingType.TEXT_AREA)
    description: string = '';
}

export class User {
    @MatInputDisable()
    id: number = 0;

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

    @MatTableDisplayLabel('Groups', (user: User) => user.userGroups.reduce((a, c) => (a ? a + ', ' : a) + c.name, ''))
    @MatInputHide()
    userGroups: UserGroup[] = [
        new UserGroup(),
    ] as UserGroup[];
}

