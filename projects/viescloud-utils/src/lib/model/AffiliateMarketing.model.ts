import { SharedUser } from "./Authenticator.model";
import { MatInputDisable, MatInputDisplayLabel, MatInputHide, MatInputIndex, MatInputItemSetting, MatInputRequire, MatInputTextArea, MatItemSettingType, MatTableHide } from "./Mat.model";

export class Product {
    @MatTableHide(true)
    @MatInputHide(true)
    ownerUserId:   number = 0;

    @MatTableHide(true)
    @MatInputHide(true)
    sharedUsers: SharedUser[] = [new SharedUser()] as SharedUser[];

    @MatInputHide(true)
    id:            number = 0;
    
    @MatInputRequire(true)
    @MatInputDisplayLabel('Product title', 'Please enter product title')
    title:         string = '';

    @MatTableHide(true)
    @MatInputDisplayLabel('Product description', 'Please enter product description')
    @MatInputTextArea(true)
    description:   string = '';

    @MatTableHide(true)
    @MatInputDisplayLabel('Product price', 'Please enter product price')
    price:         number = 0;
    
    @MatInputRequire(true)
    @MatInputDisplayLabel('Product original link', 'Please enter product original link')
    @MatInputItemSetting(MatItemSettingType.AUTO_FILL_HTTPS, true)
    originalLink:  string = '';
    
    @MatInputRequire(true)
    @MatInputDisplayLabel('Product marketing link', 'Please enter product marketing link')
    @MatInputItemSetting(MatItemSettingType.AUTO_FILL_HTTPS, true)
    marketingLink: string = '';

    @MatTableHide(true)
    @MatInputHide(true)
    category:      Category = new Category();

    @MatTableHide(true)
    @MatInputHide(true)
    fileLinks?:     FileLink[] = [new FileLink()] as FileLink[];

    @MatTableHide(true)
    @MatInputHide(true)
    pinterestPinData?: PinterestPinData = new PinterestPinData();

    static of() {
        let product = new Product();
        product.fileLinks = [];
        product.sharedUsers = [];

        return product;
    }
}

export class FileLink {
    @MatInputHide(true)
    id:        number = 0;

    @MatInputRequire(true)
    link:      string = '';

    @MatInputRequire(true)
    mediaType: string = '';
    
    @MatInputHide(true)
    external:  boolean = false;
}

export class Category {
    @MatInputHide(true)
    @MatTableHide(true)
    ownerUserId:   number = 0;

    @MatInputHide(true)
    @MatTableHide(true)
    sharedUserIds: number[] = [];

    @MatInputHide(true)
    id:            number = 0;
    name:          string = '';
}

export interface PinterestOathToken {
    ownerUserId?:          number;
    sharedUserIds?:        number[];
    id?:                   number;
    code?:                 string;
    state?:                string;
    accessToken?:          string;
    refreshToken?:         string;
    expiresIn?:            DateTime;
    refreshTokenExpireIn?: DateTime;
    redirectUri?:          string;
    scope?:                string;
    name?:                 string;
    disabled?:             boolean;
}

export interface DateTime {
    year?:            number;
    month?:           number;
    day?:             number;
    hour?:            number;
    minute?:          number;
    second?:          number;
    bypassMax?:       boolean;
    id?:              number;
    time?:            string;
    date?:            string;
    dateTime?:        string;
    maxDayThisMonth?: number;
}

export class PinterestPinData {
    id:          number = 0;
    pinRequest:  PinRequest = new PinRequest();
    pinResponse?: PinResponse = new PinResponse();
    
    constructor(id?: number, pinRequest?: PinRequest, pinResponse?: PinResponse) {
        this.id = id ?? 0;
        this.pinRequest = pinRequest ?? new PinRequest();
        this.pinResponse = pinResponse ?? new PinResponse();
    }
}

export class PinRequest {

    @MatInputHide(true)
    id:               number = 0;

    @MatInputDisplayLabel('Link', 'Please enter ad link or affiliate link')
    @MatInputIndex(2)
    link:             string = '';

    @MatInputDisplayLabel('Title', 'Please enter pin title')
    @MatInputIndex(1)
    @MatInputRequire(true)
    title:            string = '';

    @MatInputTextArea(true)
    @MatInputIndex(4)
    description:      string = '';

    @MatInputHide(true)
    dominant_color:   string = '';

    @MatInputDisplayLabel('Alt text', 'Please enter alt text when image or video is not displayed')
    @MatInputIndex(3)
    alt_text:         string = '';

    @MatInputHide(true)
    board_id:         string = '';

    @MatInputHide(true)
    board_section_id: string = '';

    @MatInputHide(true)
    media_source?:     MediaSource = new MediaSource();

    @MatInputHide(true)
    parent_pin_id:   string = '';

    @MatInputTextArea(true)
    @MatInputIndex(5)
    note:             string = '';

    @MatInputHide(true)
    boardName:        string = '';

    constructor(id?: number, link?: string, title?: string, description?: string, dominant_color?: string, alt_text?: string, board_id?: string, board_section_id?: string, media_source?: MediaSource, parent_pin_id?: string, note?: string, boardName?: string) {
        this.id = id ?? 0;
        this.link = link ?? '';
        this.title = title ?? '';
        this.description = description ?? '';
        this.dominant_color = dominant_color ?? '';
        this.alt_text = alt_text ?? '';
        this.board_id = board_id ?? '';
        this.board_section_id = board_section_id ?? '';
        this.parent_pin_id = parent_pin_id ?? '';
        this.note = note ?? '';
        this.media_source = media_source ?? new MediaSource();
        this.boardName = boardName ?? '';
    }
}

export class MediaSource {
    id:          number = 0;
    source_type: MediaSourceType = MediaSourceType.IMAGES;

    constructor(id?: number, source_type?: MediaSourceType) {
        this.id = id ?? 0;
        this.source_type = source_type ?? MediaSourceType.IMAGES;
    }
}

export enum MediaSourceType {
    IMAGES = 'multiple_image_urls',
    IMAGE = 'image_url',
    VIDEO = 'video_id'
}

export class MediaSourceImageUrl extends MediaSource {
    @MatInputDisable(true)
    override id:          number = 0;

    @MatInputDisable(true)
    override source_type: MediaSourceType = MediaSourceType.IMAGE;
    
    @MatInputRequire(true)
    @MatInputDisable(true)
    url: string = '';

    @MatInputDisable(true)
    is_standard: boolean = true;

    constructor(id?: number, source_type?: MediaSourceType, url?: string, is_standard?: boolean) {
        super(id, source_type ?? MediaSourceType.IMAGES);
        this.url = url ?? '';
        this.is_standard = is_standard ?? true;
    }
}

export class MediaSourceMultipleImage extends MediaSource {
    @MatInputDisable(true)
    override id:          number = 0;

    @MatInputDisable(true)
    override source_type: MediaSourceType = MediaSourceType.IMAGES;
    
    items:      Image[] = [] as Image[];
    index:       number = 0;

    constructor(id?: number, source_type?: MediaSourceType, images?: Image[], index?: number) {
        super(id, source_type ?? MediaSourceType.IMAGES);
        this.items = images ?? [new Image()] as Image[];
        this.index = index ?? 0;
    }
}

export class MediaSourceVideo extends MediaSource {
    @MatInputDisable(true)
    override id:          number = 0;

    @MatInputDisable(true)
    override source_type: MediaSourceType = MediaSourceType.VIDEO;

    @MatInputDisable(true)
    cover_image_url: string = '';
    
    @MatInputDisable(true)
    cover_image_content_type: string = '';

    @MatInputHide(true)
    media_id: string = '';

    @MatInputDisable(true)
    video_url: string = '';

    constructor(id?: number, source_type?: MediaSourceType, cover_image_url?: string, cover_image_content_type?: string, media_id?: string, video_url?: string) {
        super(id, source_type ?? MediaSourceType.VIDEO);
        this.cover_image_url = cover_image_url ?? '';
        this.cover_image_content_type = cover_image_content_type ?? '';
        this.media_id = media_id ?? '';
        this.video_url = video_url ?? '';
    }
}

export class Image {
    @MatInputHide(true)
    id:          number = 0;
    title:       string = '';

    @MatInputTextArea(true)
    description: string = '';
    link:        string = '';

    @MatInputDisable(true)
    @MatInputRequire(true)
    url:         string = '';

    constructor(id?: number, title?: string, description?: string, link?: string, url?: string) {
        this.id = id ?? 0;
        this.title = title ?? '';
        this.description = description ?? '';
        this.link = link ?? '';
        this.url = url ?? '';
    }
}

export class PinResponse {

    @MatInputDisable(true)
    id:                string = '';
    @MatInputDisable(true)
    created_at:        string = '';
    @MatInputDisable(true)
    is_standard:       boolean = false;
    @MatInputDisable(true)
    has_been_promoted: boolean = false;
    @MatInputDisable(true)
    link:              string = '';
    @MatInputDisable(true)
    title:             string = '';
    @MatInputDisable(true)
    description:       string = '';
    @MatInputDisable(true)
    dominant_color:    string = '';
    @MatInputDisable(true)
    alt_text:          string = '';
    @MatInputDisable(true)
    board_id:          string = '';
    @MatInputDisable(true)
    board_section_id:  string = '';
    @MatInputDisable(true)
    parent_pint_id:    string = '';
    @MatInputDisable(true)
    note:              string = '';
}
