import { User } from "./authenticator.model";

export enum PropertyMatcherEnum {
    CASE_SENSITIVE = "CASE_SENSITIVE",
    CONTAINS = "CONTAINS",
    ENDS_WITH = "ENDS_WITH",
    EXACT = "EXACT",
    IGNORE_CASE = "IGNORE_CASE",
    REGEX = "REGEX",
    STARTS_WITH = "STARTS_WITH",
    DEFAULT = "DEFAULT"
}

export enum PathNodeType {
    ITEM = "ITEM",
    PATH = "PATH"
}

export enum MatchByEnum {
    ALL = "ALL",
    ANY = "ANY",
    NONE = "NONE"
}

export enum MatchCaseEnum {
    CASE_SENSITIVE = "CASE_SENSITIVE",
    CONTAINS = "CONTAINS",
    ENDS_WITH = "ENDS_WITH",
    EXACT = "EXACT",
    IGNORE_CASE = "IGNORE_CASE",
    REGEX = "REGEX",
    STARTS_WITH = "STARTS_WITH",
    DEFAULT = "DEFAULT",
    NONE = "NONE"
}


export class PathNode<T> {
    value?: T;
    path!: string;
    type!: PathNodeType;
}

export class PageableMetadata<T> {
    pageNumber: number = 0;
    pageSize: number = 0;
    totalPage: number = 0;
    totalElement: number = 0;
    filters?: T;
}

export class Pageable<T> {
    content: T[] = [];
    _metadata: PageableMetadata<T> = new PageableMetadata();
}


export type LoginRequest = {
    username?: string;
    password: string;
    email?: string;
}

export type RegisterRequest = {
    email: string;
    username: string;
    password: string;
    alias?: string;
}

export type PasswordChangeRequest = {
    currentPassword: string;
    newPassword: string;
}

export type AliasChangeRequest = {
    alias: string;
}

export type Oauth2LoginRequest = {
    code: string;
    redirectUri: string;
    openIdProviderId: number;
}

export type AuthResponse = {
    jwt: string;
    token: string;
    tokenType: string;
    refreshToken: string;
}

export type RefreshTokenRequest = {
    refreshToken: string;
}

export type AuthEvent = {
    type: 'login' | 'logout' | 'timeout logout';
    user?: User;
}

export class DateTime {
    id?: number = 0;
    year?: number = 0;
    month?: number = 0;
    day?: number = 0;
    hour?: number = 0;
    minute?: number = 0;
    second?: number = 0;
    millis?: number = 0;

    bypassMax?: boolean = false;
    zoneId?: string = '';

    time?: string = '';
    date?: string = '';
    dateTime?: string = '';
    maxDayThisMonth?: number = 0;

    constructor(id?: number, year?: number, month?: number, day?: number, hour?: number, minute?: number, second?: number, millis?: number, bypassMax?: boolean, zoneId?: string, time?: string, date?: string, dateTime?: string, maxDayThisMonth?: number) {
        this.id = id;
        this.year = year;
        this.month = month;
        this.day = day;
        this.hour = hour;
        this.minute = minute;
        this.second = second;
        this.millis = millis;

        this.bypassMax = bypassMax;
        this.zoneId = zoneId;

        this.time = time;
        this.date = date;
        this.dateTime = dateTime;
        this.maxDayThisMonth = maxDayThisMonth;
    }

    static now(): DateTime {
        const now = new Date();

        const year = now.getFullYear();
        const month = now.getMonth() + 1; // getMonth() is 0-based
        const day = now.getDate();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const second = now.getSeconds();
        const millis = now.getMilliseconds();
        const maxDayThisMonth = new Date(year, month, 0).getDate(); // Get max day of current month
        const zoneId = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const time = now.toTimeString().split(' ')[0]; // "HH:MM:SS"
        const date = now.toISOString().split('T')[0];  // "YYYY-MM-DD"
        const dateTime = `${date}T${time}`;

        return new DateTime(
            0,
            year,
            month,
            day,
            hour,
            minute,
            second,
            millis,
            false,
            zoneId,
            time,
            date,
            dateTime,
            maxDayThisMonth
        );
    }
}

