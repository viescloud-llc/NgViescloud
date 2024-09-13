import { MatInputDisplayLabel, MatInputEnum, MatInputHide, MatInputListSetting, MatInputOptions } from "./Mat.model";

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

export class WrapWorkspace {
    name: string = '';
    backgroundPicture: string = '';
    bubbles: string[] = [];
    wrap?: Wrap = undefined;
}

export class Wrap {
    @MatInputEnum(WrapType)
    type: WrapType = WrapType.GROUP;
    title: string = '';
    provider: string = '';
    description: string = '';

    @MatInputListSetting(false, true, true)
    tags: string[] = [''] as string[];
    icon: string = '';
    @MatInputEnum(WrapHotKey)
    @MatInputDisplayLabel('Hot key')
    hotKey: WrapHotKey = WrapHotKey.NONE;
    color: string = '';

    @MatInputListSetting(false, true, true)
    link: Link[] = [new Link()] as Link[];

    @MatInputHide(true)
    children: Wrap[] = [];
}

export class Link {
    bubble: string = ''; //fancy name for mode
    serviceUrl: string = '';
    statusCheckUrl: string = '';
    @MatInputListSetting(false, true, true)
    statusCheckHeaders: Header[] = [new Header()] as Header[];
    statusCheckAcceptResponseCode: string = '';
    enableStatusCheck: boolean = false;
}

export class Header {
    name: string = '';
    value: string = '';
}
