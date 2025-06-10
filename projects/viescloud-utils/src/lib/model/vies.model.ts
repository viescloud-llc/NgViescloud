
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


