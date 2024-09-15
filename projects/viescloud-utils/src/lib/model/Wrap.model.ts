import { MatInputDisplayLabel, MatInputEnum, MatInputHide, MatInputListSetting, MatInputOptions, MatInputRequire, MatInputTextArea } from "./Mat.model";

export enum WrapType {
    GROUP = "GROUP",
    ITEM = "ITEM"
}

export enum WrapHotKey {
    NONE = "NONE",
    ONE = "1",
    TWO = "2",
    THREE = "3",
    FOUR = "4",
    FIVE = "5",
    SIX = "6",
    SEVEN = "7",
    EIGHT = "8",
    NINE = "9",
    ZERO = "0",
}

export enum WrapStatusAcceptResponseCode {
    OK = "200",
    CREATED = "201",
    NO_CONTENT = "204",
    ACCEPTED = "202",
    BAD_REQUEST = "400",
    NOT_FOUND = "404",
    NOT_ACCEPTABLE = "406",
    UNAUTHORIZED = "401",
    FORBIDDEN = "403",
    CONFLICT = "409",
    TOO_MANY_REQUEST = "429",
    NOT_IMPLEMENTED = "501",
    SERVICE_UNAVAILABLE = "503",
    GONE = "410",
    UNPROCESSABLE_ENTITY = "422",
    TOO_MANY_REQUESTS = "429",
    REQUEST_TIMEOUT = "408",
    INTERNAL_SERVER_ERROR = "500"
}

export class WrapWorkspace {
    name: string = '';
    backgroundPicture: string = '';
    bubbles: string[] = [];
    wraps: Wrap[] = [];
}

export class Wrap {
    @MatInputEnum(WrapType)
    type: WrapType = WrapType.GROUP;

    @MatInputRequire(true)
    title: string = '';

    provider: string = '';

    @MatInputTextArea(true)
    description: string = '';

    @MatInputListSetting(false, true, true)
    tags: string[] = [''] as string[];

    icon: string = '';
    
    @MatInputEnum(WrapHotKey)
    @MatInputDisplayLabel('Hot key')
    hotKey: WrapHotKey = WrapHotKey.NONE;

    color: string = '';

    @MatInputListSetting(false, true, true)
    links: Link[] = [new Link()] as Link[];

    @MatInputHide(true)
    children: Wrap[] = [];
}

export class Link {
    bubble: string = ''; //fancy name for mode
    
    label: string = '';

    @MatInputDisplayLabel('Service Url')
    serviceUrl: string = '';

    @MatInputDisplayLabel('Status Check Url')
    statusCheckUrl: string = '';

    @MatInputListSetting(false, true, true)
    statusCheckHeaders: Header[] = [new Header()] as Header[];

    @MatInputEnum(WrapStatusAcceptResponseCode)
    @MatInputDisplayLabel('Status Check Accept Response Code')
    statusCheckAcceptResponseCode: WrapStatusAcceptResponseCode = WrapStatusAcceptResponseCode.OK;

    @MatInputDisplayLabel('Enable Status Check')
    enableStatusCheck: boolean = false;
}

export class Header {
    @MatInputDisplayLabel('Header')
    name: string = '';

    @MatInputDisplayLabel('Header Value')
    value: string = '';
}
