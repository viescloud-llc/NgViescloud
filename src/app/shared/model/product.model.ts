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
    id: number = 0;
    // attributeDefinition: AttributeDefinition = new AttributeDefinition(); // this will prevent circular dependency
    value: string = '';
    displayValue: string = '';
    sortOrder: number = 0;
}

export class AttributeDefinition {
    id: number = 0;
    name: string = '';
    displayName: string = '';
    type: ProductAttributeType = ProductAttributeType.TEXT;
    unit: string = ''; // e.g., "cm", "kg", "%"
    required: boolean = false;
    variantLevel: boolean = false; // true if this attribute creates variants
    options: AttributeOption[] = [new AttributeOption()];
}

export class ProductAttribute {
    id: number = 0;
    value: string = '';
}

export class Category {
    id: number = 0;
    name: string = '';
    description: string = '';
    parentCategoryId: number = 0;
    attributeDefinitions: AttributeDefinition[] = [new AttributeDefinition()];
    parentCategory?: Category;
    childrenCategories?: Category[];
}

export class Tag {
    id: number = 0;
    name: string = '';
    description: string = '';
}

export class ProductMedia {
    id: number = 0;
    url: string = '';
    mediaType: ProductMediaType = ProductMediaType.IMAGE;
    altText: string = '';
    caption: string = '';
    sortOrder: number = 0;
    isPrimary: boolean = false;
}

export class ProductVariantAttribute {
    id: number = 0;
    attributeDefinition: AttributeDefinition = new AttributeDefinition();
    value: string = '';
    attributeOption: AttributeOption = new AttributeOption();
}

export class ProductVariant {
    id: number = 0;
    sku: string = '';
    variantName: string = '';
    price: number = 0;
    stockQuantity: number = 0;
    weight: number = 0;
    status: ProductVariantStatus = ProductVariantStatus.ACTIVE;
    medias: ProductMedia[] = [new ProductMedia()];
    attributeValues: ProductVariantAttribute[] = [new ProductVariantAttribute()];
}

export class Product {
    id: number = 0;
    name: string = '';
    description: string = '';
    category: Category = new Category();
    basePrice: number = 0;
    baseSku: string = '';
    status: ProductStatus = ProductStatus.DRAFT;
    tags: Tag[] = [new Tag()];
    variants: ProductVariant[] = [new ProductVariant()];
    attributes: ProductAttribute[] = [new ProductAttribute()];
}

