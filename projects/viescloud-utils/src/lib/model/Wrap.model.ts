import { MatInputDisplayLabel, MatInputEnum, MatInputHide, MatInputListSetting, MatInputOptions, MatInputRequire, MatInputTextArea } from "./Mat.model";
import { RgbColor } from "./Rgb.model";

export enum WrapType {
    GROUP = "GROUP",
    ITEM = "ITEM"
}

export enum WrapHotKey {
    // Numbers
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

    // Alphabet keys
    A = "A",
    B = "B",
    C = "C",
    D = "D",
    E = "E",
    F = "F",
    G = "G",
    H = "H",
    I = "I",
    J = "J",
    K = "K",
    L = "L",
    M = "M",
    N = "N",
    O = "O",
    P = "P",
    Q = "Q",
    R = "R",
    S = "S",
    T = "T",
    U = "U",
    V = "V",
    W = "W",
    X = "X",
    Y = "Y",
    Z = "Z",

    a = 'a',
    b = 'b',
    c = 'c',
    d = 'd',
    e = 'e',
    f = 'f',
    g = 'g',
    h = 'h',
    i = 'i',
    j = 'j',
    k = 'k',
    l = 'l',
    m = 'm',
    n = 'n',
    o = 'o',
    p = 'p',
    q = 'q',
    r = 'r',
    s = 's',
    t = 't',
    u = 'u',
    v = 'v',
    w = 'w',
    x = 'x',
    y = 'y',
    z = 'z',

    // Function keys
    F1 = "F1",
    F2 = "F2",
    F3 = "F3",
    F4 = "F4",
    F5 = "F5",
    F6 = "F6",
    F7 = "F7",
    F8 = "F8",
    F9 = "F9",
    F10 = "F10",
    F11 = "F11",
    F12 = "F12",

    // Modifier keys
    CTRL = "Ctrl + Control",
    SHIFT = "Shift + Shift",
    ALT = "Alt + Alt",

    // Key combinations (examples)
    CTRL_A = "Ctrl + a",
    CTRL_C = "Ctrl + c",
    CTRL_V = "Ctrl + v",
    CTRL_X = "Ctrl + x",
    CTRL_Z = "Ctrl + z",
    CTRL_Y = "Ctrl + y",

    ALT_F4 = "Alt + F4",
    ALT_TAB = "Alt + TAB",

    SHIFT_A = "SHIFT + A",

    // Key combinations with function keys
    CTRL_F1 = "Ctrl + F1",
    CTRL_F2 = "Ctrl + F2",
    CTRL_F3 = "Ctrl + F3",
    CTRL_F4 = "Ctrl + F4",
    CTRL_F5 = "Ctrl + F5",
    CTRL_F6 = "Ctrl + F6",
    CTRL_F7 = "Ctrl + F7",
    CTRL_F8 = "Ctrl + F8",
    CTRL_F9 = "Ctrl + F9",
    CTRL_F10 = "Ctrl + F10",
    CTRL_F11 = "Ctrl + F11",
    CTRL_F12 = "Ctrl + F12",

    ALT_F1 = "Alt + F1",
    ALT_F2 = "Alt + F2",
    ALT_F3 = "Alt + F3",
    ALT_F4_COMBO = "Alt + F4",
    ALT_F5 = "Alt + F5",
    ALT_F6 = "Alt + F6",
    ALT_F7 = "Alt + F7",
    ALT_F8 = "Alt + F8",
    ALT_F9 = "Alt + F9",
    ALT_F10 = "Alt + F10",
    ALT_F11 = "Alt + F11",
    ALT_F12 = "Alt + F12",

    SHIFT_F1 = "Shift + F1",
    SHIFT_F2 = "Shift + F2",
    SHIFT_F3 = "Shift + F3",
    SHIFT_F4 = "Shift + F4",
    SHIFT_F5 = "Shift + F5",
    SHIFT_F6 = "Shift + F6",
    SHIFT_F7 = "Shift + F7",
    SHIFT_F8 = "Shift + F8",
    SHIFT_F9 = "Shift + F9",
    SHIFT_F10 = "Shift + F10",
    SHIFT_F11 = "Shift + F11",
    SHIFT_F12 = "Shift + F12",

    // Key combinations with numbers
    CTRL_1 = "Ctrl + 1",
    CTRL_2 = "Ctrl + 2",
    CTRL_3 = "Ctrl + 3",
    CTRL_4 = "Ctrl + 4",
    CTRL_5 = "Ctrl + 5",
    CTRL_6 = "Ctrl + 6",
    CTRL_7 = "Ctrl + 7",
    CTRL_8 = "Ctrl + 8",
    CTRL_9 = "Ctrl + 9",
    CTRL_0 = "Ctrl + 0",

    ALT_1 = "Alt + 1",
    ALT_2 = "Alt + 2",
    ALT_3 = "Alt + 3",
    ALT_4 = "Alt + 4",
    ALT_5 = "Alt + 5",
    ALT_6 = "Alt + 6",
    ALT_7 = "Alt + 7",
    ALT_8 = "Alt + 8",
    ALT_9 = "Alt + 9",
    ALT_0 = "Alt + 0",

    SHIFT_1 = "Shift + 1",
    SHIFT_2 = "Shift + 2",
    SHIFT_3 = "Shift + 3",
    SHIFT_4 = "Shift + 4",
    SHIFT_5 = "Shift + 5",
    SHIFT_6 = "Shift + 6",
    SHIFT_7 = "Shift + 7",
    SHIFT_8 = "Shift + 8",
    SHIFT_9 = "Shift + 9",
    SHIFT_0 = "Shift + 0"
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
    corsProxyUrl: string = 'https://thingproxy.freeboard.io/fetch/';
    wraps: Wrap[] = [];
}

export class Wrap {
    @MatInputEnum(WrapType)
    type: WrapType = WrapType.GROUP;

    @MatInputRequire(true)
    title: string = '';

    @MatInputListSetting(false, true, true)
    links: Link[] = [new Link()] as Link[];

    @MatInputDisplayLabel("Provider", "e.g Google, Facebook, Twitter")
    provider: string = '';

    @MatInputTextArea(true)
    description: string = '';

    @MatInputListSetting(false, true, true)
    tags: string[] = [''] as string[];

    @MatInputDisplayLabel("Icon url", "e.g https://image.png")
    icon: string = '';
    
    @MatInputEnum(WrapHotKey)
    @MatInputDisplayLabel('Hot key')
    hotKey: WrapHotKey = WrapHotKey.NONE;

    @MatInputDisplayLabel('Wrap')
    color: RgbColor = new RgbColor();

    @MatInputDisplayLabel('Background picture url', 'e.g https://image.png')
    backgroundPicture: string = '';

    @MatInputHide(true)
    children: Wrap[] = [];
}

export class Link {
    @MatInputDisplayLabel('Label', 'e.g dev, prod, stage')
    label: string = '';

    @MatInputDisplayLabel('Service Url', 'e.g https://service.com')
    serviceUrl: string = '';

    @MatInputDisplayLabel('Status Check Url', 'e.g https://service.com')
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
    @MatInputDisplayLabel('Header', 'e.g Authorization')
    name: string = '';

    @MatInputDisplayLabel('Header Value', 'e.g Bearer ...')
    value: string = '';
}
