import { MatInputHide } from "./Mat.model";

export class WrapWorkspace {
    name: string = '';
    backgroundPicture: string = '';
    bubbles: string[] = [];
    wrap?: Wrap = undefined;
}

export class Wrap {
    type: WrapType = WrapType.GROUP;
    title: string = '';
    provider: string = '';
    description: string = '';
    tags: string[] = [''] as string[];
    icon: string = '';
    hotKey: string = '';
    color: string = '';
    link: Link[] = [new Link()] as Link[];

    @MatInputHide(true)
    children: Wrap[] = [];
}

export class Link {
    bubble: string = ''; //fancy name for mode
    serviceUrl: string = '';
    statusCheckUrl: string = '';
    statusCheckHeaders: Header[] = [new Header()] as Header[];
    statusCheckAcceptResponseCode: string = '';
    enableStatusCheck: boolean = false;
}

export class Header {
    name: string = '';
    value: string = '';
}

export enum WrapType {
    GROUP = "GROUP",
    ITEM = "ITEM"
}