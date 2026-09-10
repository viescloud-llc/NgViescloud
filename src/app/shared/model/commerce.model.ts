import { AttributeDefinition } from './attribute.model';
import { Tag, Category } from './product.model';
import { Currency } from "../../../lib/model/currency.model";
import { MatInputDisable, MatInputDisplayLabel, MatInputEnum, MatInputHide, MatInputItemSetting, MatInputListSetting, MatItemSettingType, MatTableHide, MatTableDisplayLabel } from '../../../lib/model/mat.model';
import { ViesDateTime } from "../../../lib/model/vies.model";
import { Address } from "./address.model";
import { Warehouse } from "./inventory.model";
import { ProductVariant } from "./product.model";
import { TrackedTimeStamp, TrackedTimeStampUserAccess } from "./tracked.model";

// ---- Enums --------------------------------------------------------------

// Replaces the old OrderStatus. Payment-side states (PAYMENT_PENDING / PAYMENT_CONFIRMED)
// live on the checkout module's CheckoutOrder.status, not here.
export enum FulfillmentStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    SHIPPED = "SHIPPED",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED",
    RETURNED = "RETURNED",
    REFUNDED = "REFUNDED",
    PARTIALLY_REFUNDED = "PARTIALLY_REFUNDED",
    FAILED = "FAILED"
}

export enum DiscountType {
    PERCENTAGE = "PERCENTAGE",
    FIXED_AMOUNT = "FIXED_AMOUNT",
    FREE_SHIPPING = "FREE_SHIPPING",
    BUY_X_GET_Y = "BUY_X_GET_Y"
}

export enum ShipmentStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    PICKED = "PICKED",
    PACKED = "PACKED",
    SHIPPED = "SHIPPED",
    IN_TRANSIT = "IN_TRANSIT",
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
    DELIVERED = "DELIVERED",
    FAILED = "FAILED",
    RETURNED = "RETURNED"
}

export enum ReturnStatus {
    REQUESTED = "REQUESTED",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    SHIPPED = "SHIPPED",
    RECEIVED = "RECEIVED",
    INSPECTING = "INSPECTING",
    REFUNDED = "REFUNDED",
    REPLACED = "REPLACED",
    CANCELLED = "CANCELLED"
}

export enum StockMovementType {
    PURCHASE = "PURCHASE",
    SALE = "SALE",
    ADJUSTMENT = "ADJUSTMENT",
    RETURN = "RETURN",
    DAMAGE = "DAMAGE",
    TRANSFER = "TRANSFER",
    RESERVED = "RESERVED",
    UNRESERVED = "UNRESERVED"
}

// Note: PaymentMethodType is gone — Venzora no longer owns the payment side of a purchase.
// Payment lives in the library checkout module as CheckoutTransaction.

// ---- Cart ---------------------------------------------------------------

export class CartItem extends TrackedTimeStamp {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    id: string = '';

    // NOTE: no `cart` back-ref — dropped from the backend schema; parent is
    // implicit from nesting inside cart.items.

    @MatInputHide()
    @MatTableHide()
    productVariant: ProductVariant = new ProductVariant();

    @MatInputDisplayLabel('Quantity')
    quantity: number = 0;

    // BigDecimal — snapshot of the unit price when the item was added to the cart.
    @MatInputDisplayLabel('Price at Time')
    priceAtTime: string = '0';
}

export class Cart extends TrackedTimeStampUserAccess {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    id: string = '';

    @MatInputDisable()
    @MatInputDisplayLabel('User ID')
    userId: string = '';

    @MatInputHide()
    @MatTableHide()
    @MatInputListSetting(false, true, true)
    items: CartItem[] = [new CartItem()];

    // BigDecimal.
    @MatInputDisplayLabel('Total Price')
    totalPrice: string = '0';

    @MatInputDisplayLabel('Active')
    active: boolean = true;
}

// ---- OrderFulfillment ---------------------------------------------------
// Venzora-side record of a purchase. The payment side lives in the library checkout module
// (CheckoutOrder + CheckoutTransaction), linked via checkoutOrderId.
// Table: order_fulfillments.

export class OrderFulfillmentItem extends TrackedTimeStamp {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    id: string = '';

    // NOTE: no `orderFulfillment` back-ref — dropped from the backend schema;
    // parent is implicit from nesting inside orderFulfillment.items.

    @MatInputHide()
    @MatTableHide()
    productVariant: ProductVariant = new ProductVariant();

    @MatInputDisplayLabel('Quantity')
    quantity: number = 0;

    @MatInputDisplayLabel('Unit Price')
    unitPrice: string = '0';

    @MatInputDisplayLabel('Total Price')
    totalPrice: string = '0';

    // Mirrors CheckoutLineItem.sku from the library checkout module.
    @MatInputDisplayLabel('Line Item SKU')
    lineItemSku: string = '';

    // JSON STRING (not a nested object). Parse with JSON.parse if you need it.
    @MatInputHide()
    @MatTableHide()
    productSnapshot: string = '';

    // Warehouse the line was allocated to (and sold out of) at payment capture.
    @MatInputHide()
    @MatTableHide()
    warehouseId?: string | null;
}

export class OrderFulfillment extends TrackedTimeStampUserAccess {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    id: string = '';

    // Server-managed at checkout; the order editor treats it as read-only.
    @MatInputDisable()
    @MatInputDisplayLabel('Order Number')
    orderNumber: string = '';

    @MatInputDisable()
    @MatInputDisplayLabel('User ID')
    userId: string = '';

    // Plain UUID column (not a JPA @ManyToOne) → CheckoutOrder.id in the library checkout module.
    // Resolve against `GET /api/v1/checkout/orders/{id}` for payment status / approveUrl / refund total.
    @MatInputDisable()
    @MatInputDisplayLabel('Checkout Order ID')
    checkoutOrderId: string = '';

    // Denormalized cart currency at checkout time — read-only in the order
    // editor. Changing currency after purchase would break the totals contract.
    @MatInputDisable()
    @MatInputEnum(Currency)
    @MatInputDisplayLabel('Currency')
    currency: Currency = Currency.USD;

    @MatInputHide()
    @MatTableHide()
    @MatInputListSetting(false, true, true)
    items: OrderFulfillmentItem[] = [new OrderFulfillmentItem()];

    // Money totals are locked at checkout. Admins who need to correct these
    // create a Return or manual adjustment flow — not by editing the record
    // in place. Kept visible so the numbers can be inspected in the editor.
    @MatInputDisable()
    @MatInputDisplayLabel('Subtotal')
    subtotal: string = '0';

    @MatInputDisable()
    @MatInputDisplayLabel('Tax')
    tax: string = '0';

    @MatInputDisable()
    @MatInputDisplayLabel('Shipping Cost')
    shippingCost: string = '0';

    @MatInputDisable()
    @MatInputDisplayLabel('Discount Amount')
    discountAmount: string = '0';

    @MatInputDisable()
    @MatInputDisplayLabel('Total Amount')
    totalAmount: string = '0';

    @MatInputEnum(FulfillmentStatus)
    @MatInputDisplayLabel('Status')
    status: FulfillmentStatus = FulfillmentStatus.PENDING;

    @MatInputHide()
    @MatTableHide()
    shippingAddress: Address = new Address();

    @MatInputHide()
    @MatTableHide()
    billingAddress: Address = new Address();

    @MatInputDisplayLabel('Notes')
    @MatInputItemSetting(MatItemSettingType.TEXT_AREA, true)
    notes: string = '';

    // Snapshot bag. System keys (checkout.*, discount.*, tax.*, shipping.*) are immutable
    // history — written by the checkout orchestrator, treat as read-only in the UI.
    // Manager notes go under the `notes.*` prefix by convention (not enforced server-side).
    @MatInputHide()
    @MatTableHide()
    metadata: Record<string, string> = {};
}

// ---- Discount -----------------------------------------------------------

export class Discount extends TrackedTimeStamp {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    id: string = '';

    @MatInputDisplayLabel('Code', 'e.g "SUMMER25"')
    code: string = '';

    @MatInputDisplayLabel('Description')
    @MatInputItemSetting(MatItemSettingType.TEXT_AREA, true)
    description: string = '';

    @MatInputEnum(DiscountType)
    @MatInputDisplayLabel('Discount Type')
    discountType: DiscountType = DiscountType.PERCENTAGE;

    // Meaning depends on discountType — percentage or fixed amount.
    @MatInputDisplayLabel('Discount Value')
    discountValue: string = '0';

    @MatInputDisplayLabel('Minimum Order Amount')
    minimumOrderAmount: string = '0';

    @MatInputDisplayLabel('Maximum Discount Amount')
    maximumDiscountAmount: string = '0';

    // Validity window — rendered with the dedicated <app-mat-form-field-input-time>
    // date pickers in the discount editor (the dynamic form would explode the
    // ViesDateTime object into a dozen scalar inputs), so hidden here.
    @MatInputHide()
    @MatTableHide()
    validFrom: ViesDateTime = new ViesDateTime();

    @MatInputHide()
    @MatTableHide()
    validTo: ViesDateTime = new ViesDateTime();

    // 0 (or empty) = unlimited — the backend treats null / <= 0 as no cap.
    @MatInputDisplayLabel('Max Uses', '0 = unlimited')
    maxUses: number = 0;

    // Server-owned: bumped once per checkout start.
    @MatInputDisable()
    @MatInputDisplayLabel('Current Uses')
    currentUses: number = 0;

    @MatInputDisplayLabel('Active')
    active: boolean = true;

    // Product matchers — empty = whole cart; set = only lines whose product has ANY of them
    // (categories include sub-categories). The discount amount is computed on those lines' subtotal.
    @MatInputHide()
    @MatTableDisplayLabel('Tags', (d: Discount) => (d.tags ?? []).map(t => t.name).join(', '))
    tags: Tag[] = [] as Tag[];

    @MatInputHide()
    @MatTableDisplayLabel('Categories', (d: Discount) => (d.categories ?? []).map(c => c.name).join(', '))
    categories: Category[] = [] as Category[];

    @MatInputHide()
    @MatTableDisplayLabel('Attribute definitions', (d: Discount) => (d.attributeDefinitions ?? []).map(a => a.displayName || a.name).join(', '))
    attributeDefinitions: AttributeDefinition[] = [] as AttributeDefinition[];
}

// ---- Shipment -----------------------------------------------------------

export class Shipment extends TrackedTimeStamp {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    id: string = '';

    @MatInputHide()
    @MatTableHide()
    orderFulfillment: OrderFulfillment = new OrderFulfillment();

    @MatInputDisplayLabel('Tracking Number')
    trackingNumber: string = '';

    @MatInputDisplayLabel('Carrier', 'e.g "UPS", "FedEx"')
    carrier: string = '';

    @MatInputEnum(ShipmentStatus)
    @MatInputDisplayLabel('Status')
    status: ShipmentStatus = ShipmentStatus.PENDING;

    // BOTH delivery dates are non-nullable server-side — the shipment editor
    // must supply values at create time (defaults to "now" if the admin doesn't
    // pick). Rendered via <app-mat-form-field-input-time> date pickers in the
    // editor, so hidden from the dynamic form.
    @MatInputHide()
    @MatTableHide()
    estimatedDeliveryDate: ViesDateTime = new ViesDateTime();

    @MatInputHide()
    @MatTableHide()
    actualDeliveryDate: ViesDateTime = new ViesDateTime();

    @MatInputDisplayLabel('Notes')
    @MatInputItemSetting(MatItemSettingType.TEXT_AREA, true)
    notes: string = '';

    @MatInputDisplayLabel('Tracking URL')
    trackingUrl: string = '';

    // Pickers in the editor: origin warehouse and carrier record + service level.
    @MatInputHide()
    @MatTableHide()
    warehouseId?: string | null;

    @MatInputHide()
    @MatTableHide()
    carrierId?: string | null;

    @MatInputHide()
    @MatTableHide()
    carrierServiceCode?: string | null;
}

// ---- ReturnRequest ------------------------------------------------------

export class ReturnRequest extends TrackedTimeStampUserAccess {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    id: string = '';

    // Server-generated (unique) — read-only in the editor.
    @MatInputDisable()
    @MatInputDisplayLabel('Return Number')
    returnNumber: string = '';

    @MatInputHide()
    @MatTableHide()
    orderFulfillment: OrderFulfillment = new OrderFulfillment();

    @MatInputHide()
    @MatTableHide()
    orderFulfillmentItem: OrderFulfillmentItem = new OrderFulfillmentItem();

    @MatInputDisable()
    @MatInputDisplayLabel('User ID')
    userId: string = '';

    @MatInputEnum(ReturnStatus)
    @MatInputDisplayLabel('Status')
    status: ReturnStatus = ReturnStatus.REQUESTED;

    @MatInputDisplayLabel('Reason')
    @MatInputItemSetting(MatItemSettingType.TEXT_AREA, true)
    reason: string = '';

    @MatInputDisplayLabel('Admin Notes')
    @MatInputItemSetting(MatItemSettingType.TEXT_AREA, true)
    adminNotes: string = '';

    @MatInputDisplayLabel('Return Quantity')
    returnQuantity: number = 0;

    // BigDecimal. Informational only — the actual refund moves through CheckoutOrder.refundOrder
    // in the library checkout module.
    @MatInputDisplayLabel('Refund Amount')
    refundAmount: string = '0';

    @MatInputDisplayLabel('Tracking Number')
    trackingNumber: string = '';

    @MatInputDisplayLabel('Refund Shipping')
    refundShipping: boolean = false;
}

// ---- StockMovement ------------------------------------------------------

export class StockMovement extends TrackedTimeStamp {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    id: string = '';

    @MatInputHide()
    @MatTableHide()
    productVariant: ProductVariant = new ProductVariant();

    // Which warehouse the units moved in/out of. Absent on input = the default warehouse.
    @MatInputHide()
    @MatTableDisplayLabel('Warehouse', (m: StockMovement) => m.warehouse?.name ?? '')
    warehouse?: Warehouse | null;

    @MatInputEnum(StockMovementType)
    @MatInputDisplayLabel('Movement Type')
    movementType: StockMovementType = StockMovementType.ADJUSTMENT;

    // Long — positive for additions, negative for reductions.
    @MatInputDisplayLabel('Quantity Change')
    quantityChange: number = 0;

    // Variant total across warehouses after this movement.
    @MatInputDisable()
    @MatInputDisplayLabel('Quantity After (all warehouses)')
    quantityAfter: number = 0;

    @MatInputDisable()
    @MatInputDisplayLabel('Quantity After (warehouse)')
    warehouseQuantityAfter?: number | null;

    @MatInputDisplayLabel('Reason')
    reason: string = '';

    @MatInputDisplayLabel('Reference', 'e.g order id, transfer id')
    reference: string = '';

    @MatInputDisable()
    @MatInputDisplayLabel('User ID')
    userId: string = '';
}

// ---- ShippingRule -------------------------------------------------------
// One rule per currency (DB-level unique). Drives OrderFulfillment.shippingCost.
// Missing or inactive rule → orchestrator falls back to zero shipping (warn-logged).

// How a shipping rule prices a shipment (mirrors ShippingStrategy on the backend).
export enum ShippingStrategy {
    FLAT = "FLAT",                    // flatFee
    WEIGHT_TIERED = "WEIGHT_TIERED",  // tiers by packaged grams
    PRICE_TIERED = "PRICE_TIERED",    // tiers by physical subtotal
    ITEM_TIERED = "ITEM_TIERED",      // tiers by unit count
    PER_ITEM = "PER_ITEM",            // flatFee + perItemFee × units
    CARRIER_API = "CARRIER_API"       // live carrier rate (needs a registered provider)
}

export const SHIPPING_STRATEGY_LABELS: Record<ShippingStrategy, string> = {
    [ShippingStrategy.FLAT]: 'Flat fee',
    [ShippingStrategy.WEIGHT_TIERED]: 'Tiers by weight (g)',
    [ShippingStrategy.PRICE_TIERED]: 'Tiers by order subtotal',
    [ShippingStrategy.ITEM_TIERED]: 'Tiers by item count',
    [ShippingStrategy.PER_ITEM]: 'Base fee + per item',
    [ShippingStrategy.CARRIER_API]: 'Live carrier rate (future)'
};

// One step of a tiered rule: "up to `upTo` costs `price`". BigDecimals as strings/numbers.
export interface ShippingTier {
    upTo: number | string;
    price: string;
}

// A shipping METHOD: where it applies (location matchers + aliases, same
// grammar as tax rules), what it applies to (optional product matchers — every
// physical line must match), how it is priced (strategy + its fields), and the
// modifiers every strategy honours. Several rules may cover the same zone —
// they are simply the methods offered there. Table: shipping_rule.
export class ShippingRule extends TrackedTimeStamp {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    @MatTableHide()
    id: string = '';

    @MatInputDisplayLabel('Name', 'shown to buyers, e.g "Standard", "Express"')
    name: string = '';

    @MatInputDisplayLabel('Description')
    @MatInputItemSetting(MatItemSettingType.TEXT_AREA, true)
    @MatTableHide()
    description: string = '';

    @MatInputEnum(Currency)
    @MatInputDisplayLabel('Currency')
    currency: Currency = Currency.USD;

    @MatInputDisplayLabel('Active')
    active: boolean = true;

    @MatInputDisplayLabel('Priority', 'tie-breaker between equally specific rules; higher wins')
    priority: number = 0;

    // ---- Location matchers (empty = anywhere) ----
    @MatInputDisplayLabel('Country', 'e.g "US" — empty = any')
    country: string = '';

    @MatInputHide()
    @MatTableHide()
    countryAliases: string[] = [] as string[];

    @MatInputDisplayLabel('State / Province', 'empty = any')
    state: string = '';

    @MatInputHide()
    @MatTableHide()
    stateAliases: string[] = [] as string[];

    @MatInputDisplayLabel('City', 'empty = any')
    @MatTableHide()
    city: string = '';

    @MatInputDisplayLabel('Postal Code', 'empty = any')
    @MatTableHide()
    postalCode: string = '';

    @MatInputDisplayLabel('District', 'empty = any')
    @MatTableHide()
    district: string = '';

    // ---- Product matchers (custom pickers) ----
    @MatInputHide()
    @MatTableHide()
    tags: Tag[] = [] as Tag[];

    @MatInputHide()
    @MatTableHide()
    categories: Category[] = [] as Category[];

    @MatInputHide()
    @MatTableHide()
    attributeDefinitions: AttributeDefinition[] = [] as AttributeDefinition[];

    // Warehouse hook (future): null = any origin.
    @MatInputHide()
    @MatTableHide()
    originWarehouseId?: string | null;

    // ---- Pricing (custom section in the editor) ----
    @MatInputHide()
    @MatTableDisplayLabel('Pricing', (r: ShippingRule) => SHIPPING_STRATEGY_LABELS[r.strategy] ?? r.strategy)
    strategy: ShippingStrategy = ShippingStrategy.FLAT;

    @MatInputHide()
    @MatTableHide()
    flatFee?: string = '';

    @MatInputHide()
    @MatTableHide()
    perItemFee?: string = '';

    @MatInputHide()
    @MatTableHide()
    tiers: ShippingTier[] = [] as ShippingTier[];

    @MatInputHide()
    @MatTableHide()
    overageStep?: string = '';

    @MatInputHide()
    @MatTableHide()
    overagePrice?: string = '';

    // Carrier record a CARRIER_API rule is priced through (picker in the editor).
    @MatInputHide()
    @MatTableHide()
    carrierId?: string | null;

    @MatInputHide()
    @MatTableHide()
    carrierServiceCode?: string = '';

    // ---- Modifiers (every strategy). BigDecimals; '' = unset (sent as absent). ----
    @MatInputDisplayLabel('Free above amount', 'physical subtotal at/above which this method is free; empty = never')
    @MatTableHide()
    freeAboveAmount?: string = '';

    @MatInputDisplayLabel('Handling fee', 'added on top of the rate')
    @MatTableHide()
    handlingFee?: string = '';

    @MatInputDisplayLabel('Minimum charge')
    @MatTableHide()
    minCharge?: string = '';

    @MatInputDisplayLabel('Maximum charge')
    @MatTableHide()
    maxCharge?: string = '';

    @MatInputDisplayLabel('Estimated days (min)', '0 = not shown')
    @MatTableHide()
    estimatedDaysMin: number = 0;

    @MatInputDisplayLabel('Estimated days (max)', '0 = not shown')
    @MatTableHide()
    estimatedDaysMax: number = 0;
}

// ---- Shipping quotes (POST /orders/shipping-quote, POST /shipping/rules/quote) ----

export interface ShippingOption {
    ruleId: string;
    name: string;
    description?: string | null;
    strategy: ShippingStrategy;
    carrierCode?: string | null;
    amount?: string | number | null;
    free: boolean;
    breakdown?: string | null;
    estimatedDaysMin?: number | null;
    estimatedDaysMax?: number | null;
    specificity: number;
    priority: number;
    recommended: boolean;
    available: boolean;
    unavailableReason?: string | null;
}

export interface ShippingQuote {
    currency?: Currency | null;
    digitalOnly: boolean;
    bootstrapFree: boolean;
    physicalItems: number;
    totalWeightGrams: number;
    weightMissing: boolean;
    physicalSubtotal?: string | number | null;
    recommendedRuleId?: string | null;
    options: ShippingOption[];
    message?: string | null;
}

// Admin test pad body: a synthetic cart.
export interface ShippingTestRequest {
    currency: Currency;
    shippingAddress: Address;
    lines: { productVariantId: string; quantity: number }[];
}

// ---- TaxRule ------------------------------------------------------------
// Self-hostable tax rules. Each location field (country/state/city/postalCode) is a
// matcher — null means "match any". A rule with all four matchers null is the implicit
// catch-all. Matching algorithm: filter active rules whose every non-null matcher equals
// the shipping address, sort by (specificity DESC, priority DESC), apply winner's rate.

export class TaxRule extends TrackedTimeStamp {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    id: string = '';

    @MatInputDisplayLabel('Name', 'e.g "NY State Sales Tax"')
    name: string = '';

    // BigDecimal — percentage, e.g. "8.00" for 8%.
    @MatInputDisplayLabel('Rate (%)')
    rate: string = '0';

    @MatInputDisplayLabel('Country', 'ISO 3166-1 alpha-2, e.g. "US". Empty = match any.')
    country: string = '';

    @MatInputDisplayLabel('State', 'Region code, e.g. "NY". Empty = match any.')
    state: string = '';

    @MatInputDisplayLabel('City', 'Empty = match any.')
    city: string = '';

    @MatInputDisplayLabel('Postal Code', 'Empty = match any.')
    postalCode: string = '';

    @MatInputDisplayLabel('District', 'Sub-city / administrative district. Empty = match any.')
    district: string = '';

    // Alternative spellings that also match country/state (e.g. "United States", "USA").
    // Edited via dedicated comma-separated inputs, not the dynamic form.
    @MatInputHide()
    @MatTableDisplayLabel('Country aliases', (r: TaxRule) => (r.countryAliases ?? []).join(', '))
    countryAliases: string[] = [] as string[];

    @MatInputHide()
    @MatTableDisplayLabel('State aliases', (r: TaxRule) => (r.stateAliases ?? []).join(', '))
    stateAliases: string[] = [] as string[];

    // Product matchers — empty = any product; non-empty = product must have ANY of them.
    @MatInputHide()
    @MatTableDisplayLabel('Tags', (r: TaxRule) => (r.tags ?? []).map(t => t.name).join(', '))
    tags: Tag[] = [] as Tag[];

    @MatInputHide()
    @MatTableDisplayLabel('Categories', (r: TaxRule) => (r.categories ?? []).map(c => c.name).join(', '))
    categories: Category[] = [] as Category[];

    @MatInputHide()
    @MatTableDisplayLabel('Attribute definitions', (r: TaxRule) => (r.attributeDefinitions ?? []).map(d => d.displayName || d.name).join(', '))
    attributeDefinitions: AttributeDefinition[] = [] as AttributeDefinition[];

    // Tiebreaker when matcher specificity is equal — higher wins.
    @MatInputDisplayLabel('Priority')
    priority: number = 0;

    @MatInputDisplayLabel('Active')
    active: boolean = true;

    @MatInputDisplayLabel('Description')
    @MatInputItemSetting(MatItemSettingType.TEXT_AREA, true)
    description: string = '';
}

// ---- Digital downloads (GET /api/v1/orders/{id}/downloads) -------------------
//
// One row per digital order line. `available` folds every server rule
// (payment captured, not revoked/expired/capped) so the UI greys a row out for
// the same reason the download endpoint would refuse it. Instants are ISO
// strings (not ViesDateTime).

export interface DigitalDownloadAsset {
    id: string;
    fileName: string;
    contentType?: string | null;
    size?: number | null;
    label?: string | null;
}

export interface DigitalDownloadView {
    entitlementId: string;
    orderItemId: string;
    productVariantId: string;
    variantSku?: string | null;
    variantName?: string | null;
    grantedAt?: string | null;
    revoked: boolean;
    revokedReason?: string | null;
    downloadCount: number;
    maxDownloads?: number | null;
    expiresAt?: string | null;
    lastDownloadAt?: string | null;
    available: boolean;
    unavailableReason?: string | null;
    assets: DigitalDownloadAsset[];
}
