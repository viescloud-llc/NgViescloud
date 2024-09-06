import { MatColumn, addGetPrototype, MatInputDisable, MatInputHide, MatInputRequire, MatInputSetting, MatTableHide, MatTableIndex, MatTableSetting, MatInputDisableAll } from "./Mat.model";

export class Organization {
    id?:                  string;
    users?:               User[];
    roles?:               Role[];
    organizationProfile?: OrganizationProfile;
    smtp?:                SMTP;

    constructor() {
    }
}

export class OrganizationProfile {
    @MatInputSetting(0, true, true, true)
    id?:           number = 0;

    @MatInputSetting(1, true)
    name?:         string = '';

    @MatInputSetting(2, true)
    publicEmail?:  string = '';

    @MatInputSetting(3, true)
    timeZone?:     string = '';

    @MatInputSetting(4, true)
    address?:      string = '';

    @MatInputSetting(5, true)
    city?:         string = '';

    @MatInputSetting(6, true)
    state?:        string = '';

    @MatInputSetting(7, true)
    zip?:          number = 0;

    @MatInputSetting(8, true)
    socialMedias?: string[] = [''] as string[];

    @MatInputSetting(9, true)
    bio?:          string = '';
}

export class Role {
    @MatInputDisable(true)
    id?:         number;
    @MatInputRequire(true)
    title?:      string;
    active?:     boolean;

    @MatTableHide(true)
    permission?: Permission;

    constructor(id?: number, title?: string, active?: boolean, permission?: Permission) {
        this.id = id ?? 0;
        this.title = title ?? '';
        this.active = active ?? true;
        this.permission = permission ?? new Permission();
    }
}

export class Permission {
    @MatInputDisable(true)
    id?:                        number;
    all?:                       boolean;
    readOrganizationUser?:      boolean;
    readOrganizationRole?:      boolean;
    readOrganizationProfile?:   boolean;
    readOrganizationSmtp?:      boolean;
    modifyOrganizationUser?:    boolean;
    modifyOrganizationRole?:    boolean;
    modifyOrganizationProfile?: boolean;
    modifyOrganizationSmtp?:    boolean;
    
    constructor(
        id?:                        number,
        all?:                       boolean,
        readOrganizationUser?:      boolean,
        readOrganizationRole?:      boolean,
        readOrganizationProfile?:   boolean,
        readOrganizationSmtp?:      boolean,
        modifyOrganizationUser?:    boolean,
        modifyOrganizationRole?:    boolean,
        modifyOrganizationProfile?: boolean,
        modifyOrganizationSmtp?:    boolean,
        ) {
        this.id =                        id ?? 0;
        this.all =                       all ?? true;
        this.readOrganizationUser =      readOrganizationUser ?? true;
        this.readOrganizationRole =      readOrganizationRole ?? true;
        this.readOrganizationProfile =   readOrganizationProfile ?? true;
        this.readOrganizationSmtp =      readOrganizationSmtp ?? true;
        this.modifyOrganizationUser =    modifyOrganizationUser ?? true;
        this.modifyOrganizationRole =    modifyOrganizationRole ?? true;
        this.modifyOrganizationProfile = modifyOrganizationProfile ?? true;
        this.modifyOrganizationSmtp =    modifyOrganizationSmtp ?? true;
    }
}

export interface SMTP {
    id?:       number;
    host?:     string;
    port?:     number;
    username?: string;
    password?: string;
}

export class User {
    @MatInputDisable(true)
    @MatTableSetting('User ID')
    id?:          number;

    @MatInputHide(true)
    @MatTableSetting('Name', (user: User) => user.userProfile?.alias ?? user.userProfile?.firstName + ' ' + user.userProfile?.lastName)
    userProfile?: UserProfile;

    @MatTableSetting('Roles', (user: User) => user.defineRole?.reduce((a, c) => (a? a + ', ' : a) + c.title, ''))
    defineRole?:  Role[];

    constructor(id?: number, userProfile?: UserProfile, defineRole?: Role[]) {
        this.id = id;
        this.userProfile = userProfile ?? new UserProfile();
        this.defineRole = defineRole ?? [new Role()] as Role[];
        Object.setPrototypeOf(this.defineRole, Role);
    }
}

@MatInputDisableAll(true, ['id', 'alias', 'firstName', 'lastName', 'email', 'city', 'state', 'zip'])
export class UserProfile {
    id?:        number = 0;
    alias?:     string = '';
    firstName?: string = '';
    lastName?:  string = '';
    email?:     string = '';
    city?:      string = '';
    state?:     string = '';
    zip?:       number = 0;
}

export class OrganizationJoinRequest {
    @MatInputHide(true)
    id:             number = 0;

    @MatInputHide(true)
    userId:         number = 0;
    organizationId: string = '';
    message:        string = '';
    timeCreated:    TimeCreated = new TimeCreated();
}

export class TimeCreated {
    @MatInputDisable(true)
    year:      number = 0;
    @MatInputDisable(true)
    month:     number = 0;
    @MatInputDisable(true)
    day:       number = 0;
    @MatInputDisable(true)
    hours:     number = 0;
    @MatInputDisable(true)
    minute:    number = 0;
    @MatInputDisable(true)
    second:    number = 0;
    @MatInputDisable(true)
    bypassMax: boolean = false;
    @MatInputDisable(true)
    id:        number = 0;
    @MatInputDisable(true)
    status:    string = '';
    @MatInputDisable(true)
    time:      string = '';
    @MatInputDisable(true)
    date:      string = '';
    @MatInputDisable(true)
    maxDay:    number = 0;
}
