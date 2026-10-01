import { MatInputDisable, MatInputDisplayLabel, MatInputEnum, MatInputHide, MatInputItemSetting, MatInputListSetting, MatInputTextArea, MatItemSettingType, MatTableDisplayLabel, MatTableHide } from '../../../lib/model/mat.model';
import { RgbColor } from '../../../lib/model/rgb.model';
import { ViesDateTime } from '../../../lib/model/vies.model';
import { Product } from './product.model';
import { PublicStoreInfo } from './store-settings.model';
import { TrackedTimeStamp } from './tracked.model';

// Storefront customisation (checklist-2 §12). Every editable shape is a
// DECORATED CLASS so the lib dynamic form renders it (theme / header / footer /
// announcement / SEO / behaviour / sections). Colours are RgbColor on the client
// (lib colour picker) and hex on the wire; instants are ViesDateTime on the
// client (lib date-time picker) and ISO strings on the wire — see the
// toWire()/fromWire() helpers at the bottom.

// ---- Helpers: hex ↔ RgbColor, ISO ↔ ViesDateTime ---------------------------------
export function hexToRgb(hex?: string | null, fallback = '#4f46e5'): RgbColor {
    const h = (hex && /^#?[0-9a-f]{6}$/i.test(hex) ? hex : fallback).replace('#', '');
    const c = new RgbColor(); c.name = '#' + h.toLowerCase();
    c.r = parseInt(h.slice(0, 2), 16); c.g = parseInt(h.slice(2, 4), 16); c.b = parseInt(h.slice(4, 6), 16);
    return c;
}
export function rgbToHex(c?: RgbColor | null): string {
    if (!c) return '';
    const p = (n: number) => Math.max(0, Math.min(255, Math.round(Number(n) || 0))).toString(16).padStart(2, '0');
    return `#${p(c.r)}${p(c.g)}${p(c.b)}`;
}
export function isoToDt(iso?: string | null): ViesDateTime | undefined { return iso ? ViesDateTime.fromJsDate(new Date(iso)) : undefined; }
export function dtToIso(dt?: ViesDateTime | null): string | null { return dt && dt.year ? ViesDateTime.toJsDate(dt).toISOString() : null; }

// ---- Appearance parts -------------------------------------------------------------
export enum ColorScheme { SYSTEM = 'SYSTEM', LIGHT = 'LIGHT', DARK = 'DARK' }
export enum FontPreset { SYSTEM = 'SYSTEM', SERIF = 'SERIF', ROUNDED = 'ROUNDED', MONO = 'MONO' }
export enum StylePreset { SHARP = 'SHARP', SOFT = 'SOFT', PILL = 'PILL' }
export enum NavSource { CATEGORIES = 'CATEGORIES', CUSTOM = 'CUSTOM', BOTH = 'BOTH' }
export enum SocialNetwork { instagram = 'instagram', facebook = 'facebook', x = 'x', tiktok = 'tiktok', youtube = 'youtube', pinterest = 'pinterest', linkedin = 'linkedin', other = 'other' }

export class SfTheme {
    @MatInputDisplayLabel('Primary colour', 'buttons, links, the hero background')
    primaryColor: RgbColor = hexToRgb('#4f46e5');
    @MatInputDisplayLabel('Accent colour', 'call-to-action buttons, promo tiles')
    accentColor: RgbColor = hexToRgb('#f59e0b');
    @MatInputEnum(ColorScheme)
    @MatInputDisplayLabel('Colour scheme', 'SYSTEM follows the visitor\'s device')
    colorScheme: ColorScheme = ColorScheme.SYSTEM;
    @MatInputEnum(FontPreset)
    @MatInputDisplayLabel('Font')
    fontPreset: FontPreset = FontPreset.SYSTEM;
    @MatInputEnum(StylePreset)
    @MatInputDisplayLabel('Style', 'corner radius of cards and buttons')
    stylePreset: StylePreset = StylePreset.SOFT;
}

export class SfLink {
    @MatInputDisplayLabel('Label')
    label: string = '';
    @MatInputDisplayLabel('URL', '/pages/about or https://…')
    url: string = '';
}

export class SfHeader {
    @MatInputEnum(NavSource)
    @MatInputDisplayLabel('Navigation shows', 'top-level categories, your custom links, or both')
    navSource: NavSource = NavSource.CATEGORIES;
    @MatInputListSetting(false, true, true)
    @MatInputDisplayLabel('Custom links')
    customLinks: SfLink[] = [new SfLink()];
    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true)
    @MatInputDisplayLabel('Show search')
    showSearch: boolean = true;
    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true)
    @MatInputDisplayLabel('Show account')
    showAccount: boolean = true;
    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true)
    @MatInputDisplayLabel('Show cart')
    showCart: boolean = true;
}

export class SfFooterColumn {
    @MatInputDisplayLabel('Column title')
    title: string = '';
    @MatInputListSetting(false, true, true)
    @MatInputDisplayLabel('Links')
    links: SfLink[] = [new SfLink()];
}

export class SfSocialLink {
    @MatInputEnum(SocialNetwork)
    @MatInputDisplayLabel('Network')
    network: SocialNetwork = SocialNetwork.instagram;
    @MatInputDisplayLabel('URL')
    url: string = '';
}

export class SfFooter {
    @MatInputListSetting(false, true, true)
    @MatInputDisplayLabel('Link columns')
    columns: SfFooterColumn[] = [new SfFooterColumn()];
    @MatInputListSetting(false, true, true)
    @MatInputDisplayLabel('Social links')
    socialLinks: SfSocialLink[] = [new SfSocialLink()];
    @MatInputDisplayLabel('Copyright line', 'empty = "© <store name>"')
    copyright: string = '';
    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true)
    @MatInputDisplayLabel('Show business address', 'from Settings → Store')
    showBusinessAddress: boolean = true;
    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true)
    @MatInputDisplayLabel('Show support contact')
    showSupportContact: boolean = true;
}

export class SfAnnouncement {
    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true)
    @MatInputDisplayLabel('Enabled')
    enabled: boolean = false;
    @MatInputDisplayLabel('Text')
    text: string = '';
    @MatInputDisplayLabel('Link (optional)')
    link: string = '';
    @MatInputDisplayLabel('Bar colour')
    color: RgbColor = hexToRgb('#222222');
    // Window — rendered with the lib date-time picker in the editor.
    @MatInputHide() startsAt?: ViesDateTime;
    @MatInputHide() endsAt?: ViesDateTime;
}

export class SfSeo {
    @MatInputDisplayLabel('Title template', '{page} and {storeName} are replaced')
    titleTemplate: string = '{page} — {storeName}';
    @MatInputTextArea()
    @MatInputDisplayLabel('Default meta description')
    metaDescription: string = '';
    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true)
    @MatInputDisplayLabel('Allow search engines', 'off for staging')
    robotsIndex: boolean = true;
}

export class SfBrand {
    // Picked with the asset picker (object storage), not typed.
    @MatInputHide() faviconAssetId: string | null = null;
    @MatInputHide() shareImageAssetId: string | null = null;
}

export class StorefrontAppearance {
    theme: SfTheme = new SfTheme();
    brand: SfBrand = new SfBrand();
    header: SfHeader = new SfHeader();
    footer: SfFooter = new SfFooter();
    announcement: SfAnnouncement = new SfAnnouncement();
    seo: SfSeo = new SfSeo();
}

export enum ListingSort { NEWEST = 'NEWEST', PRICE_ASC = 'PRICE_ASC', PRICE_DESC = 'PRICE_DESC', NAME = 'NAME' }
export class StorefrontBehaviour {
    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true) @MatInputDisplayLabel('Show out-of-stock products') showOutOfStock: boolean = true;
    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true) @MatInputDisplayLabel('Show stock counts') showStockCounts: boolean = false;
    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true) @MatInputDisplayLabel('Show reviews') showReviews: boolean = true;
    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true) @MatInputDisplayLabel('Allow guest checkout') allowGuestCheckout: boolean = false;
    @MatInputDisplayLabel('Minimum order amount', 'empty = none') minimumOrderAmount: string = '';
    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true) @MatInputDisplayLabel('Prices shown include tax') pricesIncludeTax: boolean = false;
    @MatInputEnum(ListingSort) @MatInputDisplayLabel('Default listing sort') defaultSort: ListingSort = ListingSort.NEWEST;
    @MatInputDisplayLabel('Products per page', '1–200') productsPerPage: number = 24;
}

// ---- Product selector -----------------------------------------------------------------
export enum SelectorMatch { ANY = 'ANY', ALL = 'ALL' }
export enum SelectorSort { NEWEST = 'NEWEST', PRICE_ASC = 'PRICE_ASC', PRICE_DESC = 'PRICE_DESC', NAME = 'NAME', MANUAL = 'MANUAL' }
export interface ProductSelector {
    productIds: string[]; categoryIds: string[]; tagIds: string[]; attributeDefinitionIds: string[];
    match: SelectorMatch; sort: SelectorSort; limit: number;
}
export function blankSelector(): ProductSelector { return { productIds: [], categoryIds: [], tagIds: [], attributeDefinitionIds: [], match: SelectorMatch.ANY, sort: SelectorSort.NEWEST, limit: 8 }; }

// ---- Page sections: one decorated settings class per type ----------------------------
export enum SectionType { HERO = 'HERO', FEATURED_PRODUCTS = 'FEATURED_PRODUCTS', CATEGORY_GRID = 'CATEGORY_GRID', PROMO_TILES = 'PROMO_TILES', NEW_ARRIVALS = 'NEW_ARRIVALS', RICH_TEXT = 'RICH_TEXT', REVIEWS = 'REVIEWS', NEWSLETTER = 'NEWSLETTER' }
export const SECTION_LABELS: Record<SectionType, string> = {
    HERO: 'Hero banner', FEATURED_PRODUCTS: 'Featured products', CATEGORY_GRID: 'Category grid', PROMO_TILES: 'Promo tiles',
    NEW_ARRIVALS: 'New arrivals', RICH_TEXT: 'Rich text', REVIEWS: 'Reviews strip', NEWSLETTER: 'Newsletter signup'
};
export class HeroSettings {
    @MatInputDisplayLabel('Headline') headline: string = '';
    @MatInputDisplayLabel('Subtext') subtext: string = '';
    @MatInputDisplayLabel('Button label') buttonLabel: string = 'Shop now';
    @MatInputDisplayLabel('Button URL') buttonUrl: string = '/shop/products';
    @MatInputHide() imageAssetId: string | null = null;
}
export class FeaturedProductsSettings {
    @MatInputDisplayLabel('Title') title: string = 'Featured';
    @MatInputHide() selector: ProductSelector = blankSelector();
}
export class NewArrivalsSettings {
    @MatInputDisplayLabel('Title') title: string = 'New arrivals';
    @MatInputDisplayLabel('How many') limit: number = 8;
}
export class CategoryGridSettings { @MatInputDisplayLabel('Title') title: string = 'Shop by category'; }
export class PromoTile {
    @MatInputDisplayLabel('Tile title') title: string = '';
    @MatInputDisplayLabel('Link URL') url: string = '';
    @MatInputHide() imageAssetId: string | null = null;
}
export class PromoTilesSettings {
    @MatInputListSetting(false, true, true)
    @MatInputDisplayLabel('Tiles')
    tiles: PromoTile[] = [new PromoTile()];
}
export class RichTextSettings { @MatInputTextArea() @MatInputDisplayLabel('HTML') html: string = '<p></p>'; }
export class ReviewsSettings { @MatInputDisplayLabel('Title') title: string = 'What customers say'; @MatInputDisplayLabel('How many') limit: number = 6; }
export class NewsletterSettings { @MatInputDisplayLabel('Title') title: string = 'Stay in the loop'; @MatInputDisplayLabel('Text') text: string = 'Get news and offers by email.'; }
export function blankSettingsFor(type: SectionType): object {
    switch (type) {
        case SectionType.HERO: return new HeroSettings();
        case SectionType.FEATURED_PRODUCTS: return new FeaturedProductsSettings();
        case SectionType.NEW_ARRIVALS: return new NewArrivalsSettings();
        case SectionType.CATEGORY_GRID: return new CategoryGridSettings();
        case SectionType.PROMO_TILES: return new PromoTilesSettings();
        case SectionType.RICH_TEXT: return new RichTextSettings();
        case SectionType.REVIEWS: return new ReviewsSettings();
        default: return new NewsletterSettings();
    }
}
export interface PageSection { id?: string; type: SectionType; enabled: boolean; settings: Record<string, any>; }

// ---- Pages, templates, schedules (ViesRestService resources) ----------------------------
// Where the storefront puts a page: "/" renders HOME, checkout links TERMS/PRIVACY,
// the return flow shows RETURNS_POLICY, the contact route renders CONTACT. Every
// role but CUSTOM is unique and its page cannot be deleted (only left unpublished).
export enum PageRole { HOME = 'HOME', TERMS = 'TERMS', PRIVACY = 'PRIVACY', RETURNS_POLICY = 'RETURNS_POLICY', SHIPPING_POLICY = 'SHIPPING_POLICY', CONTACT = 'CONTACT', ABOUT = 'ABOUT', FAQ = 'FAQ', CUSTOM = 'CUSTOM' }
export const PAGE_ROLE_LABELS: Record<PageRole, string> = { HOME: 'Home', TERMS: 'Terms of service', PRIVACY: 'Privacy policy', RETURNS_POLICY: 'Returns policy', SHIPPING_POLICY: 'Shipping policy', CONTACT: 'Contact', ABOUT: 'About', FAQ: 'FAQ', CUSTOM: 'Custom page' };
export const isSystemRole = (r?: PageRole | null) => !!r && r !== PageRole.CUSTOM;
// A named version of a page's content: its own draft and published sections.
export interface PageBody { id: string; pageId: string; name: string; draftSections: PageSection[]; publishedSections?: PageSection[] | null; publishedAt?: string | null; }

// Row shape for the page editor's Bodies table (decorator-driven columns).
export class PageBodyRow {
    @MatTableHide() id: string = '';
    @MatTableDisplayLabel('Body') name: string = '';
    @MatTableDisplayLabel('Live', (r: PageBodyRow) => r.live ? '● live' : '') live: boolean = false;
    @MatTableDisplayLabel('Published', (r: PageBodyRow) => r.publishedAt ? r.publishedAt.slice(0, 16).replace('T', ' ') : 'never') publishedAt: string = '';
    @MatTableDisplayLabel('Draft', (r: PageBodyRow) => r.draftDiffers ? 'differs from published' : (r.publishedAt ? 'same as published' : 'unpublished')) draftDiffers: boolean = false;
    @MatTableDisplayLabel('Sections') sections: number = 0;
}

export class StorefrontPage extends TrackedTimeStamp {
    @MatInputDisable() @MatInputDisplayLabel('ID') @MatTableHide() id: string = '';
    // Role is rendered by the editor with its own option widget (locked on system pages).
    @MatInputHide() @MatTableDisplayLabel('Role', (p: StorefrontPage) => PAGE_ROLE_LABELS[p.role] ?? p.role) role: PageRole = PageRole.CUSTOM;
    @MatInputDisplayLabel('Title') title: string = '';
    @MatInputDisplayLabel('Slug (URL)', 'lower-case handle: about, terms, returns-policy') slug: string = '';
    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true) @MatInputDisplayLabel('Active') @MatTableHide() active: boolean = true;
    // Which body customers see; owned by "make live".
    @MatInputHide() @MatTableDisplayLabel('Live body', (p: StorefrontPage) => p.liveBodyId ? ((p.bodies ?? []).find(b => b.id === p.liveBodyId)?.name ?? 'yes') : 'offline') liveBodyId?: string | null = null;
    @MatInputHide() @MatTableDisplayLabel('Bodies', (p: StorefrontPage) => String((p.bodies ?? []).length)) bodies: PageBody[] = [];
}

export class StorefrontTemplate extends TrackedTimeStamp {
    @MatInputDisable() @MatInputDisplayLabel('ID') @MatTableHide() id: string = '';
    @MatInputDisplayLabel('Name') name: string = '';
    @MatInputTextArea() @MatInputDisplayLabel('Description') @MatTableHide() description: string = '';
    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true) @MatInputDisplayLabel('Overrides theme') @MatTableHide() overrideTheme: boolean = true;
    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true) @MatInputDisplayLabel('Overrides brand assets') @MatTableHide() overrideBrand: boolean = false;
    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true) @MatInputDisplayLabel('Overrides header & navigation') @MatTableHide() overrideHeader: boolean = false;
    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true) @MatInputDisplayLabel('Overrides footer') @MatTableHide() overrideFooter: boolean = false;
    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true) @MatInputDisplayLabel('Overrides announcement bar') @MatTableHide() overrideAnnouncement: boolean = true;
    // Which page roles this template may restyle (default HOME + CUSTOM). Rendered with the lib multi-select.
    @MatInputHide() @MatTableDisplayLabel('Pages', (t: StorefrontTemplate) => (t.affectedRoles ?? []).map(r => PAGE_ROLE_LABELS[r] ?? r).join(', ')) affectedRoles: PageRole[] = [PageRole.HOME, PageRole.CUSTOM];
    @MatInputHide() @MatTableDisplayLabel('Overrides', (t: StorefrontTemplate) => [t.overrideTheme && 'theme', t.overrideBrand && 'brand', t.overrideHeader && 'header', t.overrideFooter && 'footer', t.overrideAnnouncement && 'announcement'].filter(Boolean).join(', ')) draftAppearance: StorefrontAppearance = new StorefrontAppearance();
    @MatInputHide() @MatTableHide() publishedAppearance?: StorefrontAppearance | null = null;
    // Which body each affected page shows while the template is live (pageId → bodyId). Rendered per page in the editor.
    @MatInputHide() @MatTableHide() pageBodies: Record<string, string> = {};
    @MatInputHide() @MatTableDisplayLabel('Published', (t: StorefrontTemplate) => t.publishedAt ? t.publishedAt.slice(0, 16).replace('T', ' ') : 'draft only') publishedAt?: string | null = null;
}

export class StorefrontSchedule extends TrackedTimeStamp {
    @MatInputDisable() @MatInputDisplayLabel('ID') @MatTableHide() id: string = '';
    @MatInputHide() @MatTableHide() templateId: string = '';
    @MatInputDisplayLabel('Window name') name: string = '';
    // Rendered with the lib date-time picker; ISO on the wire.
    @MatInputHide() @MatTableDisplayLabel('From', (s: StorefrontSchedule) => s.startsAt ? s.startsAt.slice(0, 16).replace('T', ' ') : '') startsAt: string = '';
    @MatInputHide() @MatTableDisplayLabel('Until', (s: StorefrontSchedule) => s.endsAt ? s.endsAt.slice(0, 16).replace('T', ' ') : 'open-ended') endsAt?: string | null = null;
    @MatInputDisplayLabel('Priority', 'highest wins when windows overlap') priority: number = 10;
    @MatInputItemSetting(MatItemSettingType.SLIDE_TOGGLE, true) @MatInputDisplayLabel('Enabled') enabled: boolean = true;
}

// ---- Assets, resolved -----------------------------------------------------------------
export type AssetOwnerType = 'SETTINGS' | 'TEMPLATE' | 'PAGE';
export interface StorefrontAsset { id: string; ownerType: AssetOwnerType; ownerId?: string | null; fileName: string; contentType: string; size: number; label?: string | null; url: string; }
export interface ResolvedSection { id: string; type: SectionType; settings: Record<string, any>; products?: Product[] | null; }
export interface WireTheme { primaryColor: string; accentColor: string; colorScheme: string; fontPreset: string; stylePreset: string; }
export interface WireAnnouncement { enabled: boolean; text?: string | null; link?: string | null; color?: string | null; startsAt?: string | null; endsAt?: string | null; }
export interface WireAppearance { theme: WireTheme; brand: { faviconAssetId?: string | null; shareImageAssetId?: string | null }; header: { navSource: string; customLinks: SfLink[]; showSearch: boolean; showAccount: boolean; showCart: boolean }; footer: { columns: { title: string; links: SfLink[] }[]; socialLinks: { network: string; url: string }[]; copyright?: string | null; showBusinessAddress: boolean; showSupportContact: boolean }; announcement: WireAnnouncement; seo: { titleTemplate?: string | null; metaDescription?: string | null; robotsIndex: boolean }; }
export interface WireBehaviour { showOutOfStock: boolean; showStockCounts: boolean; showReviews: boolean; allowGuestCheckout: boolean; minimumOrderAmount?: string | number | null; pricesIncludeTax: boolean; defaultSort: string; productsPerPage: number; }
export interface ResolvedStorefront {
    version: string; store: PublicStoreInfo; appearance: WireAppearance; behaviour: WireBehaviour;
    navigation: { label: string; url: string; categoryId?: string | null }[];
    announcement?: WireAnnouncement | null; home: ResolvedSection[];
    pages: PageLink[];
    /** System pages by role — checkout / returns / contact resolve slugs here. */
    pagesByRole: Record<string, PageLink>;
    activeTemplate?: { id: string; name: string; preview: boolean } | null;
}
export interface PageLink { slug: string; title: string; role: string; published: boolean; }
/** GET /public/storefront/pages/{slug} — a page as customers see it now (template applied when it affects the role). */
export interface PageView { slug: string; title: string; role: string; sections: ResolvedSection[]; publishedAt?: string | null; templateName?: string | null; }

// ---- Wire ↔ client --------------------------------------------------------------------
function fixList<T extends object>(items: unknown, make: () => T, fix?: (x: T) => T): T[] {
    const arr = Array.isArray(items) ? items : [];
    return arr.map(i => { const o = Object.assign(make(), i); return fix ? fix(o) : o; });
}
export function appearanceFromWire(w?: Partial<WireAppearance> | null): StorefrontAppearance {
    const a = new StorefrontAppearance();
    if (w?.theme) { a.theme = Object.assign(new SfTheme(), w.theme, { primaryColor: hexToRgb(w.theme.primaryColor, '#4f46e5'), accentColor: hexToRgb(w.theme.accentColor, '#f59e0b') }); }
    if (w?.brand) a.brand = Object.assign(new SfBrand(), w.brand);
    if (w?.header) a.header = Object.assign(new SfHeader(), w.header, { customLinks: fixList(w.header.customLinks, () => new SfLink()) });
    if (w?.footer) a.footer = Object.assign(new SfFooter(), w.footer, { copyright: w.footer.copyright ?? '', columns: fixList(w.footer.columns, () => new SfFooterColumn(), c => Object.assign(c, { links: fixList(c.links, () => new SfLink()) })), socialLinks: fixList(w.footer.socialLinks, () => new SfSocialLink()) });
    if (w?.announcement) a.announcement = Object.assign(new SfAnnouncement(), { enabled: !!w.announcement.enabled, text: w.announcement.text ?? '', link: w.announcement.link ?? '', color: hexToRgb(w.announcement.color, '#222222'), startsAt: isoToDt(w.announcement.startsAt), endsAt: isoToDt(w.announcement.endsAt) });
    if (w?.seo) a.seo = Object.assign(new SfSeo(), { titleTemplate: w.seo.titleTemplate ?? '', metaDescription: w.seo.metaDescription ?? '', robotsIndex: w.seo.robotsIndex !== false });
    return a;
}
export function appearanceToWire(a: StorefrontAppearance): WireAppearance {
    const links = (l: SfLink[]) => (l ?? []).filter(x => x.label?.trim() || x.url?.trim()).map(x => ({ label: x.label, url: x.url }));
    return {
        theme: { primaryColor: rgbToHex(a.theme.primaryColor), accentColor: rgbToHex(a.theme.accentColor), colorScheme: a.theme.colorScheme, fontPreset: a.theme.fontPreset, stylePreset: a.theme.stylePreset },
        brand: { faviconAssetId: a.brand.faviconAssetId, shareImageAssetId: a.brand.shareImageAssetId },
        header: { navSource: a.header.navSource, customLinks: links(a.header.customLinks), showSearch: a.header.showSearch, showAccount: a.header.showAccount, showCart: a.header.showCart },
        footer: { columns: (a.footer.columns ?? []).filter(c => c.title?.trim() || (c.links ?? []).length).map(c => ({ title: c.title, links: links(c.links) })), socialLinks: (a.footer.socialLinks ?? []).filter(s => s.url?.trim()).map(s => ({ network: s.network, url: s.url })), copyright: a.footer.copyright || null, showBusinessAddress: a.footer.showBusinessAddress, showSupportContact: a.footer.showSupportContact },
        announcement: { enabled: a.announcement.enabled, text: a.announcement.text || null, link: a.announcement.link || null, color: rgbToHex(a.announcement.color) || null, startsAt: dtToIso(a.announcement.startsAt), endsAt: dtToIso(a.announcement.endsAt) },
        seo: { titleTemplate: a.seo.titleTemplate || null, metaDescription: a.seo.metaDescription || null, robotsIndex: a.seo.robotsIndex }
    };
}
export function behaviourFromWire(w?: Partial<WireBehaviour> | null): StorefrontBehaviour {
    return Object.assign(new StorefrontBehaviour(), w ?? {}, { minimumOrderAmount: w?.minimumOrderAmount == null ? '' : String(w.minimumOrderAmount), defaultSort: (w?.defaultSort as ListingSort) ?? ListingSort.NEWEST });
}
export function behaviourToWire(b: StorefrontBehaviour): WireBehaviour {
    return { ...b, minimumOrderAmount: String(b.minimumOrderAmount ?? '').trim() === '' ? null : String(b.minimumOrderAmount).trim(), productsPerPage: Number(b.productsPerPage) || 24 };
}
export function sectionsFromWire(list?: PageSection[] | null): PageSection[] {
    return (list ?? []).map(s => ({ ...s, settings: Object.assign(blankSettingsFor(s.type), s.settings ?? {}) }));
}
export function bodyFromWire(b: PageBody): PageBody {
    return { ...b, draftSections: sectionsFromWire(b.draftSections), publishedSections: b.publishedSections ? sectionsFromWire(b.publishedSections) : null };
}
