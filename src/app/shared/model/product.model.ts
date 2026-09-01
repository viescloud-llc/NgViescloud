import { Currency } from "../../../lib/model/currency.model";
import { MatInputDisable, MatInputDisplayLabel, MatInputEnum, MatInputHide, MatInputItemSetting, MatInputListSetting, MatInputRequire, MatItemSettingType, MatTableHide } from "../../../lib/model/mat.model";
import { AttributeDefinition, ProductAttribute, ProductVariantAttribute } from "./attribute.model";
import { TrackedTimeStamp } from "./tracked.model";

export enum ProductStatus {
    DRAFT = "DRAFT",
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    DISCONTINUED = "DISCONTINUED"
}

export enum ProductVariantStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    OUT_OF_STOCK = "OUT_OF_STOCK"
}

// How a variant's `price` field is interpreted at read time. Server resolves
// this into `effectivePrice`; the frontend only echoes it for preview.
export enum VariantPriceMode {
    NORMAL = "NORMAL",                        // price IS the effective price
    FLAT_ADJUSTMENT = "FLAT_ADJUSTMENT",      // price is a signed delta on product.basePrice
    PERCENT_ADJUSTMENT = "PERCENT_ADJUSTMENT" // price is a signed % on product.basePrice
}

export enum ProductMediaType {
    IMAGE = "IMAGE",
    VIDEO = "VIDEO"
}

export class Tag {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    id: string = '';

    @MatInputDisplayLabel('Name', 'e.g "Tshirt" or "Jeans"')
    @MatInputRequire()
    name: string = '';

    @MatInputDisplayLabel('Description', 'Internal-only description of the tag.')
    @MatInputItemSetting(MatItemSettingType.TEXT_AREA, true)
    description: string = '';
}

export class Category {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    id: string = '';

    @MatInputDisplayLabel('Name')
    @MatInputRequire()
    name: string = '';

    @MatInputDisplayLabel('Description')
    @MatInputItemSetting(MatItemSettingType.TEXT_AREA, true)
    description: string = '';

    // UUID of the parent — plain column on the backend, no FK. Cycle/orphan checks are client-side.
    @MatInputHide()
    parentCategoryId: string = '';

    // Which attribute definitions apply to products in this category.
    @MatInputHide()
    @MatTableHide()
    attributeDefinitions: AttributeDefinition[] = [new AttributeDefinition()];

    // @Transient on the backend — only present if the server enriches the response. Build the tree client-side from parentCategoryId.
    @MatInputHide()
    @MatTableHide()
    parentCategory?: Category;

    @MatInputHide()
    @MatTableHide()
    childrenCategories?: Category[];
}

export class ProductMedia {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    id: string = '';

    // NOTE: no product/productVariant back-refs — the backend schema dropped
    // them (see backend-openapi.json). Parent attachment is decided purely by
    // NESTING: medias inside product.medias belong to the product, medias
    // inside variants[i].medias belong to that variant.

    // url and objectStorageDataId are managed by the media picker/gallery UI
    // (from-URL / from-upload flow) rather than typed by the admin, so both are
    // rendered as READ-ONLY in the metadata form — visible so the admin can
    // see what's stored, but not editable directly (use the Replace button on
    // the gallery instead). `url` holds whatever the storefront should render:
    // either the original external link the admin pasted, or the vies backend
    // link generated after uploading to object storage. `objectStorageDataId`
    // is the id of the underlying stored file when the media was uploaded (or
    // a remote URL was ingested via the backend service); empty when the admin
    // chose to keep the raw external URL.
    @MatInputDisable()
    @MatInputDisplayLabel('URL')
    @MatTableHide()
    url: string = '';

    @MatInputDisable()
    @MatInputDisplayLabel('Object Storage Data ID')
    @MatTableHide()
    objectStorageDataId: string = '';

    @MatInputEnum(ProductMediaType)
    @MatInputDisplayLabel('Media Type')
    mediaType: ProductMediaType = ProductMediaType.IMAGE;

    @MatInputDisplayLabel('Alt Text', 'e.g "image of a tshirt"')
    altText: string = '';

    @MatInputDisplayLabel('Caption')
    caption: string = '';

    @MatInputDisplayLabel('Sort Order')
    sortOrder: number = 0;

    @MatInputDisplayLabel('Is Primary')
    isPrimary: boolean = false;
}

export class ProductVariant extends TrackedTimeStamp {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    id: string = '';

    // NOTE: no `product` back-ref — the backend schema dropped it. A variant's
    // parent is implicit from nesting inside product.variants; the variant
    // editor tracks the parent id from the URL instead.

    @MatInputDisplayLabel('SKU (Stock Keeping Unit)')
    sku: string = '';

    @MatInputDisplayLabel('Variant Name', 'e.g "Blue T-Shirt" or "Black T-Shirt"')
    variantName: string = '';

    // Raw price input — meaning depends on `priceMode`. Server resolves this
    // + priceMode into `effectivePrice` at read time. Hidden from the dynamic
    // form and the mat-table because the variant editor renders a custom
    // Pricing section (label/hint adapts to mode) and the variants table
    // shows the resolved `effectivePrice` instead. BigDecimal-as-string.
    @MatInputHide()
    @MatTableHide()
    price?: string = '0';

    // Selects how `price` is interpreted. Defaults to NORMAL so existing
    // one-mode variants keep working. Same reason for hiding from form/table
    // as `price` — it's rendered in the custom Pricing section.
    @MatInputHide()
    @MatTableHide()
    priceMode: VariantPriceMode = VariantPriceMode.NORMAL;

    // Server-computed resolved price. READ-ONLY: never send back on PUT/POST
    // (the save flow strips it). Hidden from the dynamic form (rendered as a
    // live preview in the custom Pricing section), but VISIBLE in the
    // variants table on the product page so admins can compare variants at
    // a glance.
    @MatInputHide()
    @MatInputDisplayLabel('Effective Price')
    effectivePrice?: string;

    // Long on the backend, but always small enough for a JS number.
    @MatInputDisplayLabel('Stock Quantity')
    stockQuantity: number = 0;

    @MatInputDisplayLabel('Weight')
    weight: string = '0';

    @MatInputEnum(ProductVariantStatus)
    @MatInputDisplayLabel('Status')
    status: ProductVariantStatus = ProductVariantStatus.ACTIVE;

    @MatInputHide()
    @MatTableHide()
    @MatInputListSetting(false, true, true)
    medias: ProductMedia[] = [new ProductMedia()];

    @MatInputHide()
    @MatTableHide()
    @MatInputListSetting(false, true, true)
    attributeValues: ProductVariantAttribute[] = [new ProductVariantAttribute()];
}

export class Product extends TrackedTimeStamp {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    id: string = '';

    @MatInputDisplayLabel('Name', 'e.g "Blue T-Shirt" or "Black T-Shirt"')
    name: string = '';

    @MatInputDisplayLabel('Description', 'Give a detailed description of the product.')
    @MatInputItemSetting(MatItemSettingType.TEXT_AREA, true)
    description: string = '';

    @MatInputHide()
    @MatTableHide()
    category: Category = new Category();

    @MatInputEnum(Currency)
    @MatInputDisplayLabel('Currency')
    currency: Currency = Currency.USD;

    // BigDecimal — keep as string.
    @MatInputDisplayLabel('Base Price')
    basePrice: string = '0';

    @MatInputDisplayLabel('Base SKU (Stock Keeping Unit)', 'e.g "TSHIRT-BLUE" or "TSHIRT-BLACK"')
    baseSku: string = '';

    @MatInputEnum(ProductStatus)
    @MatInputDisplayLabel('Status')
    status: ProductStatus = ProductStatus.DRAFT;

    // Hidden from the dynamic form because the product editor renders tags via
    // a dedicated multi-select picker against the global Tag pool (better UX
    // than inline sub-form editing).
    @MatInputHide()
    @MatTableHide()
    tags: Tag[] = [new Tag()];

    @MatInputHide()
    @MatTableHide()
    variants: ProductVariant[] = [new ProductVariant()];

    @MatInputHide()
    @MatTableHide()
    attributes: ProductAttribute[] = [new ProductAttribute()];

    @MatInputHide()
    @MatTableHide()
    medias: ProductMedia[] = [new ProductMedia()];
}
