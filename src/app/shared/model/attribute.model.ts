import { MatInputDisable, MatInputDisplayLabel, MatInputEnum, MatInputHide, MatInputListSetting, MatTableHide } from "../../../lib/model/mat.model";
import { ViesDate, ViesDateTime, ViesTime } from "../../../lib/model/vies.model";

export enum ProductAttributeType {
    TEXT = "TEXT",
    NUMBER = "NUMBER",
    BOOLEAN = "BOOLEAN",
    SELECT = "SELECT",
    MULTI_SELECT = "MULTI_SELECT",
    DATE = "DATE",
    TIME = "TIME",
    DATE_TIME = "DATE_TIME"
}

export class AttributeOption {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    id: string = '';

    @MatInputDisplayLabel('Value (canonical)', 'e.g "RED"')
    value: string = '';

    @MatInputDisplayLabel('Display Value (label)', 'e.g "Ocean Red"')
    displayValue: string = '';

    @MatInputDisplayLabel('Sort Order')
    sortOrder: number = 0;
    // attributeDefinition is @JsonIgnore on the backend; intentionally omitted to avoid cycles.
}

export class AttributeDefinition {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    id: string = '';

    @MatInputDisplayLabel('Name', 'e.g "Size"')
    name: string = '';

    @MatInputDisplayLabel('Display Name (label)', 'e.g "Product Size"')
    displayName: string = '';

    @MatInputEnum(ProductAttributeType)
    @MatInputDisplayLabel('Type')
    type: ProductAttributeType = ProductAttributeType.TEXT;

    @MatInputDisplayLabel('Unit', 'e.g "cm", "kg", "%"')
    unit: string = '';

    // NOTE: `required` and `variantLevel` were dropped from the backend contract.
    // A single AttributeDefinition can now be used for BOTH product-level and
    // variant-level attributes — the admin decides case-by-case where to attach
    // it (Product Attributes tab vs Variants tab). Whether a value is required
    // is now driven by the product/category schema, not the definition.

    @MatInputHide()
    @MatTableHide()
    @MatInputListSetting(false, true, true)
    options: AttributeOption[] = [new AttributeOption()];
}

// Polymorphic value envelope: only the slot matching the parent
// AttributeDefinition.type should be populated; the rest must be cleared
// before PUT or the backend will persist stale values (no server-side validation today).
export class AttributeValue {
    textValue?: string;
    numberValue?: string;     // BigDecimal: keep as string to avoid float drift
    booleanValue?: boolean;
    dateValue?: ViesDate;
    timeValue?: ViesTime;
    dateTimeValue?: ViesDateTime;
    selectValue?: AttributeOption;
    multiSelectValues?: AttributeOption[];
}

export class ProductAttribute {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    id: string = '';

    @MatInputHide()
    @MatTableHide()
    attributeDefinition: AttributeDefinition = new AttributeDefinition();

    @MatInputHide()
    @MatTableHide()
    attributeValue: AttributeValue = new AttributeValue();
}

export class ProductVariantAttribute {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    id: string = '';

    @MatInputHide()
    @MatTableHide()
    attributeDefinition: AttributeDefinition = new AttributeDefinition();

    @MatInputHide()
    @MatTableHide()
    attributeValue: AttributeValue = new AttributeValue();
}
