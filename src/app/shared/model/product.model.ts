import { MatInputDisable, MatInputEnum, MatInputHide, MatInputItemSetting, MatInputRequire, MatInputSetting, MatInputSettings, MatItemSettingType, MatTableHide } from "../../../lib/model/mat.model";
import { MatFormFieldInputKeys } from "../../../lib/model/mat.model";

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
    @MatInputSettings(
        {disable: true},
        {type: MatFormFieldInputKeys.label, value: 'ID'}
    )
    id: number = 0;
    // attributeDefinition: AttributeDefinition = new AttributeDefinition(); // this will prevent circular dependency

    @MatInputSettings(
        {require: true},
        {type: MatFormFieldInputKeys.label, value: 'Value (accual value)'}
    )
    value: string = '';

    @MatInputSettings(
        {require: true},
        {type: MatFormFieldInputKeys.label, value: 'Display Value (label)'}
    )
    displayValue: string = '';

    @MatInputSettings(
        {},
        {type: MatFormFieldInputKeys.label, value: 'Sort Order'}
    )
    sortOrder: number = 0;
}

export class AttributeDefinition {
    @MatInputSettings(
        {disable: true},
        {type: MatFormFieldInputKeys.label, value: 'ID'}
    )
    id: number = 0;

    @MatInputSettings(
        {require: true},
        {type: MatFormFieldInputKeys.label, value: 'Name'}
    )
    name: string = '';

    @MatInputSettings(
        {require: true},
        {type: MatFormFieldInputKeys.label, value: 'Display Name (label)'}
    )
    displayName: string = '';

    @MatInputEnum(ProductAttributeType)
    @MatInputSettings(
        {},
        {type: MatFormFieldInputKeys.label, value: 'Type'}
    )
    type: ProductAttributeType = ProductAttributeType.TEXT;

    @MatInputSettings(
        {},
        {type: MatFormFieldInputKeys.label, value: 'Unit'},
        {type: MatFormFieldInputKeys.placeholder, value: 'e.g "cm", "kg", "%"'},
    )
    unit: string = ''; // e.g., "cm", "kg", "%"

    @MatInputSettings(
        {},
        {type: MatFormFieldInputKeys.label, value: 'Required'}
    )
    required: boolean = false;

    @MatInputSettings(
        {},
        {type: MatFormFieldInputKeys.label, value: 'Variant Level'}
    )
    variantLevel: boolean = false; // true if this attribute creates variants

    @MatInputSettings(
        {hide: true},
        {type: MatFormFieldInputKeys.label, value: 'Option'}
    )
    @MatTableHide()
    options: AttributeOption[] = [new AttributeOption()];
}

export class ProductAttribute {
    @MatInputSettings(
        {disable: true},
        {type: MatFormFieldInputKeys.label, value: 'ID'}
    )
    id: number = 0;
    AttributeDefinition: AttributeDefinition = new AttributeDefinition();

    @MatInputSettings(
        {},
        {type: MatFormFieldInputKeys.label, value: 'Value'}
    )
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
    @MatInputSettings(
        {disable: true}, 
        {type: MatFormFieldInputKeys.label, value: 'ID'}
    )
    id: number = 0;

    @MatInputSettings(
        {}, 
        {type: MatFormFieldInputKeys.label, value: 'Name'},
        {type: MatFormFieldInputKeys.placeholder, value: 'e.g "Tshirt" or "Jeans"'}
    )
    name: string = '';
    
    @MatInputSettings(
        {}, 
        {type: MatFormFieldInputKeys.label, value: 'Description'},
        {type: MatFormFieldInputKeys.isTextArea, value: true},
        {type: MatFormFieldInputKeys.placeholder, value: 'Give a detailed description of the tag. (this is only for internal use)'}
    )
    description: string = '';
}

export class ProductMedia {
    @MatInputSettings(
        {disable: true},
        {type: MatFormFieldInputKeys.label, value: 'ID'}
    )
    id: number = 0;

    @MatInputSettings(
        {require: true},
        {type: MatFormFieldInputKeys.label, value: 'URL'},
        {type: MatFormFieldInputKeys.placeholder, value: 'e.g "https://example.com/image.jpg"'}
    )
    url: string = '';

    @MatInputEnum(ProductMediaType)
    mediaType: ProductMediaType = ProductMediaType.IMAGE;

    @MatInputSettings(
        {},
        {type: MatFormFieldInputKeys.label, value: 'Alt Text'},
        {type: MatFormFieldInputKeys.placeholder, value: 'e.g "image of a tshirt"'}
    )
    altText: string = '';

    @MatInputSettings(
        {},
        {type: MatFormFieldInputKeys.label, value: 'Caption'},
    )
    caption: string = '';

    @MatInputSettings(
        {},
        {type: MatFormFieldInputKeys.label, value: 'Sort Order'}
    )
    sortOrder: number = 0;

    @MatInputSettings(
        {},
        {type: MatFormFieldInputKeys.label, value: 'Is Primary'}
    )
    isPrimary: boolean = false;
}

export class ProductVariantAttribute {
    @MatInputSettings(
        {disable: true},
        {type: MatFormFieldInputKeys.label, value: 'ID'}
    )
    id: number = 0;

    attributeDefinition: AttributeDefinition = new AttributeDefinition();

    @MatInputSettings(
        {},
        {type: MatFormFieldInputKeys.label, value: 'Value'}
    )
    value: string = '';
    attributeOption: AttributeOption = new AttributeOption();
}

export class ProductVariant {
    @MatInputSettings(
        {disable: true},
        {type: MatFormFieldInputKeys.label, value: 'ID'}
    )
    id: number = 0;

    @MatInputSettings(
        {},
        {type: MatFormFieldInputKeys.label, value: 'SKU (Stock Keeping Unit)'},
    )
    sku: string = '';

    @MatInputSettings(
        {},
        {type: MatFormFieldInputKeys.label, value: 'Variant Name'},
        {type: MatFormFieldInputKeys.placeholder, value: 'e.g "Blue T-Shirt" or "Black T-Shirt"'}
    )
    variantName: string = '';

    @MatInputSettings(
        {},
        {type: MatFormFieldInputKeys.label, value: 'Price'},
    )
    price: number = 0;

    @MatInputSettings(
        {},
        {type: MatFormFieldInputKeys.label, value: 'Stock Quantity'},
    )
    stockQuantity: number = 0;

    @MatInputSettings(
        {},
        {type: MatFormFieldInputKeys.label, value: 'Weight'},
    )
    weight: number = 0;

    @MatInputEnum(ProductVariantStatus)
    @MatInputSettings(
        {},
        {type: MatFormFieldInputKeys.label, value: 'Status'},
    )
    status: ProductVariantStatus = ProductVariantStatus.ACTIVE;
    medias: ProductMedia[] = [new ProductMedia()];
    attributeValues: ProductVariantAttribute[] = [new ProductVariantAttribute()];
}

export class Product {
    @MatInputSettings(
        {disable: true}, 
        {type: MatFormFieldInputKeys.label, value: 'ID'}
    )
    id: number = 0;

    @MatInputSettings(
        {require: true}, 
        {type: MatFormFieldInputKeys.label, value: 'Name'}, 
        {type: MatFormFieldInputKeys.placeholder, value: 'e.g "Blue T-Shirt" or "Black T-Shirt"'}
    )
    name: string = '';

    @MatInputSettings(
        {}, 
        {type: MatFormFieldInputKeys.isTextArea, value: true},
        {type: MatFormFieldInputKeys.label, value: 'Description'}, 
        {type: MatFormFieldInputKeys.placeholder, value: 'Give a detailed description of the product.'}
    )
    description: string = '';

    @MatInputHide()
    category: Category = new Category();

    @MatInputSettings(
        {}, 
        {type: MatFormFieldInputKeys.label, value: 'Base Price'}
    )
    basePrice: number = 0;

    @MatInputSettings(
        {}, 
        {type: MatFormFieldInputKeys.label, value: 'Base SKU (Stock Keeping Unit)'},
        {type: MatFormFieldInputKeys.placeholder, value: 'e.g "TSHIRT-BLUE" or "TSHIRT-BLACK"'}
    )
    baseSku: string = '';

    @MatInputEnum(ProductStatus)
    @MatInputSettings(
        {}, 
        {type: MatFormFieldInputKeys.label, value: 'Status'}
    )
    status: ProductStatus = ProductStatus.DRAFT;

    @MatInputSettings(
        {}, 
        {type: MatFormFieldInputKeys.label, value: 'Tags'},
        {type: MatFormFieldInputKeys.showListAddItemButton, value: true},
        {type: MatFormFieldInputKeys.showListRemoveItemButton, value: true},
    )
    tags: Tag[] = [new Tag()];
    
    @MatInputHide()
    variants: ProductVariant[] = [new ProductVariant()];

    @MatInputHide()
    attributes: ProductAttribute[] = [new ProductAttribute()];

    @MatInputHide()
    medias: ProductMedia[] = [new ProductMedia()];
}

