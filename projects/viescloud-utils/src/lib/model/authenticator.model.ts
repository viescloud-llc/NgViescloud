import { ReflectionUtils } from "../util/Reflection.utils";
import { MatColumn, MatInputDisable, MatInputHide, MatTableHide, MatTableDisplayLabel, DateTime } from "./mat.model";

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

export interface Jwt {
    jwt?: string;
}

export class User {

    @MatInputDisable(true)
    id?: number;

    @MatInputDisable(true)
    sub?: string;

    @MatInputDisable(true)
    email?: string;

    name?: string
    username?: string;

    @MatInputHide(true)
    password?: string;

    userProfile?: UserProfile;

    @MatInputHide(true)
    userRoles?: UserRole[];

    @MatInputHide(true)
    userApis?: UserAPI[];

    @MatInputHide(true)
    expirable?: boolean;

    @MatInputHide(true)
    expireTime?: DateTime;

    @MatInputHide(true)
    enable?: boolean;

    constructor(
        id?: number, sub?: string, email?: string, name?: string, username?: string, password?: string, userProfile?: UserProfile, userRoles?: UserRole[], userApis?: UserAPI[], expirable?: boolean, expireTime?: DateTime, enable?: boolean
    ) {
        this.id = id ?? 0;
        this.sub = sub ?? '';
        this.email = email ?? '';
        this.name = name ?? '';
        this.username = username ?? '';
        this.password = password ?? '';
        this.userProfile = userProfile ?? new UserProfile();
        this.userRoles = userRoles = [];
        this.userApis = userApis;
        this.expirable = expirable;
        this.expireTime = expireTime;
        this.enable = enable ?? true;
    }
}

export class UserAPI {

    @MatInputDisable(true)
    id?: number;
    name?: string;
    apiKey?: string;
    expirable?: boolean;
    enable?: boolean;
    expireTime?: DateTime;

    constructor(id?: number, name?: string, apiKey?: string, expirable?: boolean, enable?: boolean, expireTime?: DateTime) {
        this.id = id ?? 0;
        this.name = name ?? '';
        this.apiKey = apiKey ?? '';
        this.expirable = expirable;
        this.enable = enable ?? true;
        this.expireTime = expireTime;
    }
}

export class UserProfile {
    @MatInputDisable(true)
    id?: number;
    alias?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;

    constructor(id?: number, alias?: string, firstName?: string, lastName?: string, phoneNumber?: string, address?: string, city?: string, state?: string, zip?: string) {
        this.id = id ?? 0;
        this.alias = alias ?? '';
        this.firstName = firstName ?? '';
        this.lastName = lastName ?? '';
        this.phoneNumber = phoneNumber ?? '';
        this.address = address ?? '';
        this.city = city ?? '';
        this.state = state ?? '';
        this.zip = zip ?? '';
    }
}

export interface UserRole {
    id?: number;
    name?: string;
    level?: number;
}

export interface Route {
    id?: number;
    path?: string;
    method?: string;
    secure?: boolean;
    roles?: UserRole[];
}

export default class UserRow {
    id?: number;
    username?: string;
    email?: string;
    enable?: boolean;
    userRoles?: string;

    constructor(id: number, username: string, email: string, enable: boolean, userRoles: string) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.enable = enable;
        this.userRoles = userRoles;
    }
}

export class Player {
    id!: number;
    alias!: string;

    constructor(user: User) {
        this.id = user.id!;
        this.alias = user.userProfile!.alias!;
    }
}

export interface OpenIdRequest {
    code: string;
    state: string;
    redirectUri: string;
}

export interface Swaggers {
    serviceName: string;
    prefix: string;
    paths: SwaggerPath[];
}

export class SwaggerPath {
    @MatTableDisplayLabel("Absolute Path (with Regrex)")
    path?: string;

    @MatTableHide(true)
    method?: SwaggerMethod[];

    constructor(path?: string, method?: SwaggerMethod[]) {
        this.path = path;
        this.method = method ?? [new SwaggerMethod()] as SwaggerMethod[];
    }
}

export class SwaggerMethod {
    name?: SwaggerMethodName;
    summary?: null | string;
    operationId?: string;

    constructor(name?: SwaggerMethodName, summary?: string, operationId?: string) {
        this.name = name;
        this.summary = summary;
        this.operationId = operationId;
    }
}

export enum SwaggerMethodName {
    Get = "GET",
    Post = "POST",
    Put = "PUT",
    Patch = "PATCH",
    Delete = "DELETE",
}
