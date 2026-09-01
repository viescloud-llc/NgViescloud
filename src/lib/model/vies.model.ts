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

export enum FileType {
    IMAGE = "IMAGE",
    VIDEO = "VIDEO",
    AUDIO = "AUDIO",
    FILE = "FILE",
    FOLDER = "FOLDER",
    UNKNOWN = "UNKNOWN"
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

// Flat pagination shape returned by Spring controllers built on the newer Vies framework
// (e.g. the Venzora backend). Use this for any list endpoint that hands back
// `{ content, page, size, totalElements, totalPages }` directly. `Pageable<T>` above is the
// older nested shape; both coexist until consumers migrate.
// Pagination metadata block as the backend actually serializes it (see
// backend-openapi.json `Metadata` schema — note the singular `totalElement` /
// `totalPage` field names; they're not typos here).
export interface PageMetadata {
    pageNumber?: number;    // 0-based current page
    pageSize?: number;      // requested page size
    totalElement?: number;
    totalPage?: number;
    sort?: string;
    filters?: unknown;
    matchBy?: string;
    matchCase?: string;
}

// Paginated response wrapper: `{ content: T[], _metadata: {...} }` per the
// backend OpenAPI (NOT a flat {content, page, size, totalElements} shape).
export interface PageResponse<T> {
    content: T[];
    _metadata?: PageMetadata;
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
    openIdProviderId: string;
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

export class ViesDate {
    year?: number = 0;
    month?: number = 0;
    day?: number = 0;

    bypassMax?: boolean = false;
    zoneId?: string = '';

    maxDayThisMonth?: number = 0;
    date?: string = '';

    static now(): ViesDate {
        return ViesDate.fromJsDate(new Date());
    }

    static fromJsDate(d: Date): ViesDate {
        const year = d.getFullYear();
        const month = d.getMonth() + 1; // getMonth() is 0-based
        const day = d.getDate();
        const maxDayThisMonth = new Date(year, month, 0).getDate();
        const zoneId = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const date = d.toISOString().split('T')[0].replaceAll('-', '/'); // YYYY/MM/DD

        const out = new ViesDate();
        out.year = year;
        out.month = month;
        out.day = day;
        out.maxDayThisMonth = maxDayThisMonth;
        out.date = date;
        out.zoneId = zoneId;
        return out;
    }

    // Static so it works on plain object literals from the wire too, not only class instances.
    // Midnight local time on the given date.
    static toJsDate(dt?: ViesDate | null): Date {
        if (!dt) return new Date(NaN);
        return new Date(dt.year ?? 1970, (dt.month ?? 1) - 1, dt.day ?? 1);
    }
}

export class ViesTime {
    hour?: number = 0;
    minute?: number = 0;
    second?: number = 0;
    millis?: number = 0;

    bypassMax?: boolean = false;
    zoneId?: string = '';

    time?: string = '';

    static now(): ViesTime {
        return ViesTime.fromJsDate(new Date());
    }

    static fromJsDate(d: Date): ViesTime {
        const hour = d.getHours();
        const minute = d.getMinutes();
        const second = d.getSeconds();
        const millis = d.getMilliseconds();
        const zoneId = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const time = d.toISOString().split('T')[1].split('.')[0] + '.' + millis; // HH:MM:SS.MMM

        const out = new ViesTime();
        out.hour = hour;
        out.minute = minute;
        out.second = second;
        out.millis = millis;
        out.time = time;
        out.zoneId = zoneId;
        return out;
    }

    // Returns today's date with the given time-of-day. Useful for binding to mat-timepicker etc.
    static toJsDate(t?: ViesTime | null): Date {
        if (!t) return new Date(NaN);
        const d = new Date();
        d.setHours(t.hour ?? 0, t.minute ?? 0, t.second ?? 0, t.millis ?? 0);
        return d;
    }
}

export class ViesDateTime {
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
    offsetDayTime?: string = '';
    zonedDayTime?: string = '';
    maxDayThisMonth?: number = 0;

    static now(): ViesDateTime {
        return ViesDateTime.fromJsDate(new Date());
    }

    static fromJsDate(d: Date): ViesDateTime {
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const hour = d.getHours();
        const minute = d.getMinutes();
        const second = d.getSeconds();
        const millis = d.getMilliseconds();
        const maxDayThisMonth = new Date(year, month, 0).getDate();
        const zoneId = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const time = d.toTimeString().split(' ')[0]; // "HH:MM:SS"
        const date = d.toISOString().split('T')[0];  // "YYYY-MM-DD"
        const dateTime = `${date} | ${time}`;

        const out = new ViesDateTime();
        out.year = year;
        out.month = month;
        out.day = day;
        out.hour = hour;
        out.minute = minute;
        out.second = second;
        out.millis = millis;
        out.zoneId = zoneId;
        out.time = time;
        out.date = date;
        out.dateTime = dateTime;
        out.offsetDayTime = d.toISOString();
        out.zonedDayTime = d.toISOString();
        out.maxDayThisMonth = maxDayThisMonth;
        return out;
    }

    static toJsDate(dt?: ViesDateTime | null): Date {
        if (!dt) return new Date(NaN);
        return new Date(
            dt.year ?? 1970,
            (dt.month ?? 1) - 1,
            dt.day ?? 1,
            dt.hour ?? 0,
            dt.minute ?? 0,
            dt.second ?? 0,
            dt.millis ?? 0
        );
    }
}

export interface VFile {
  name: string;
  type: string;
  extension: string;
  rawFile?: globalThis.File | Blob;
  originalLink?: string;
  objectUrl: string;
  value?: any;
}

export interface ViesForm<T> {
    save(input?: T): void;
    revert(input?: T): void;
    remove(): void;
}

export interface ViesListForm<T> extends ViesForm<T> {
    add(input?: T): void;
    addAll(input?: T[]): void;
}