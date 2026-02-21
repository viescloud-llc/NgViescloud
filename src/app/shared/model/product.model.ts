import { MatInputDisable, MatInputEnum, MatInputHide, MatInputItemSetting, MatInputRequire, MatInputSetting, MatItemSettingType } from "../../../lib/model/mat.model";

export enum ProductAttributeType {
    TEXT = "TEXT",
    NUMBER = "NUMBER",
    BOOLEAN = "BOOLEAN",
    SELECT = "SELECT",
    MULTISELECT = "MULTISELECT",
    DATE = "DATE",
    JSON = "JSON"
}

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

export enum ProductMediaType {
    IMAGE = "IMAGE",
    VIDEO = "VIDEO"
}

export class AttributeOption {
    @MatInputDisable()
    id: number = 0;
    // attributeDefinition: AttributeDefinition = new AttributeDefinition(); // this will prevent circular dependency
    value: string = '';
    displayValue: string = '';
    sortOrder: number = 0;
}

export class AttributeDefinition {
    @MatInputDisable()
    id: number = 0;
    name: string = '';
    displayName: string = '';

    @MatInputEnum(ProductAttributeType)
    type: ProductAttributeType = ProductAttributeType.TEXT;
    unit: string = ''; // e.g., "cm", "kg", "%"
    required: boolean = false;
    variantLevel: boolean = false; // true if this attribute creates variants
    options: AttributeOption[] = [new AttributeOption()];
}

export class ProductAttribute {
    @MatInputDisable()
    id: number = 0;
    AttributeDefinition: AttributeDefinition = new AttributeDefinition();
    value: string = '';
}

export class Category {
    @MatInputDisable()
    id: number = 0;
    name: string = '';
    @MatInputItemSetting(MatItemSettingType.TEXT_AREA)
    description: string = '';
    @MatInputHide()
    parentCategoryId: number = 0;
    attributeDefinitions: AttributeDefinition[] = [new AttributeDefinition()];
    @MatInputHide()
    parentCategory?: Category;
    @MatInputHide()
    childrenCategories?: Category[];
}

export class Tag {
    @MatInputDisable()
    id: number = 0;
    name: string = '';
    @MatInputItemSetting(MatItemSettingType.TEXT_AREA)
    description: string = '';
}

export class ProductMedia {
    @MatInputDisable()
    id: number = 0;
    url: string = '';

    @MatInputEnum(ProductMediaType)
    mediaType: ProductMediaType = ProductMediaType.IMAGE;
    altText: string = '';
    caption: string = '';
    sortOrder: number = 0;
    isPrimary: boolean = false;
}

export class ProductVariantAttribute {
    @MatInputDisable()
    id: number = 0;
    attributeDefinition: AttributeDefinition = new AttributeDefinition();
    value: string = '';
    attributeOption: AttributeOption = new AttributeOption();
}

export class ProductVariant {
    @MatInputDisable()
    id: number = 0;
    sku: string = '';
    variantName: string = '';
    price: number = 0;
    stockQuantity: number = 0;
    weight: number = 0;

    @MatInputEnum(ProductVariantStatus)
    status: ProductVariantStatus = ProductVariantStatus.ACTIVE;
    medias: ProductMedia[] = [new ProductMedia()];
    attributeValues: ProductVariantAttribute[] = [new ProductVariantAttribute()];
}

export class Product {
    @MatInputDisable()
    id: number = 0;

    @MatInputRequire()
    name: string = '';

    @MatInputItemSetting(MatItemSettingType.TEXT_AREA)
    description: string = '';

    @MatInputHide()
    category: Category = new Category();
    basePrice: number = 0;
    baseSku: string = '';

    @MatInputEnum(ProductStatus)
    status: ProductStatus = ProductStatus.DRAFT;

    @MatInputItemSetting(MatItemSettingType.LIST_SHOW_ADD_ITEM_BUTTON)
    @MatInputItemSetting(MatItemSettingType.LIST_SHOW_REMOVE_ITEM_BUTTON)
    tags: Tag[] = [new Tag()];
    
    @MatInputHide()
    variants: ProductVariant[] = [new ProductVariant()];

    @MatInputHide()
    attributes: ProductAttribute[] = [new ProductAttribute()];

    @MatInputHide()
    medias: ProductMedia[] = [new ProductMedia()];
}

