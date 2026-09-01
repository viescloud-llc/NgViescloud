import { Currency } from "../../../lib/model/currency.model";
import { MatInputDisable, MatInputDisplayLabel, MatInputEnum, MatInputHide, MatInputItemSetting, MatInputListSetting, MatItemSettingType, MatTableHide } from "../../../lib/model/mat.model";
import { ViesDateTime } from "../../../lib/model/vies.model";
import { Address } from "./address.model";
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

    // null = unlimited.
    @MatInputDisplayLabel('Max Uses')
    maxUses: number = 0;

    @MatInputDisable()
    @MatInputDisplayLabel('Current Uses')
    currentUses: number = 0;

    @MatInputDisplayLabel('Active')
    active: boolean = true;
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

    @MatInputEnum(StockMovementType)
    @MatInputDisplayLabel('Movement Type')
    movementType: StockMovementType = StockMovementType.ADJUSTMENT;

    // Long — positive for additions, negative for reductions.
    @MatInputDisplayLabel('Quantity Change')
    quantityChange: number = 0;

    // Denormalized running total after this movement.
    @MatInputDisable()
    @MatInputDisplayLabel('Quantity After')
    quantityAfter: number = 0;

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

export class ShippingRule extends TrackedTimeStamp {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    id: string = '';

    // One rule per currency (DB-unique). Hidden from the dynamic form — the
    // editor renders a custom picker that EXCLUDES currencies already taken
    // by another rule, so the 409 can't happen from the UI. Kept visible in
    // tables (the list is one-row-per-currency).
    @MatInputHide()
    @MatInputEnum(Currency)
    @MatInputDisplayLabel('Currency')
    currency: Currency = Currency.USD;

    // BigDecimal — shipping fee when below the free-above threshold.
    @MatInputDisplayLabel('Flat Fee')
    flatFee: string = '0';

    // BigDecimal — null/undefined disables the free-shipping threshold.
    // Optional so the editor can send it as ABSENT (Jackson rejects "" for
    // BigDecimal); the '' default only exists for the form's blank object.
    @MatInputDisplayLabel('Free Above Amount')
    freeAboveAmount?: string = '';

    @MatInputDisplayLabel('Description')
    @MatInputItemSetting(MatItemSettingType.TEXT_AREA, true)
    description: string = '';

    @MatInputDisplayLabel('Active')
    active: boolean = true;
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

    // Tiebreaker when matcher specificity is equal — higher wins.
    @MatInputDisplayLabel('Priority')
    priority: number = 0;

    @MatInputDisplayLabel('Active')
    active: boolean = true;

    @MatInputDisplayLabel('Description')
    @MatInputItemSetting(MatItemSettingType.TEXT_AREA, true)
    description: string = '';
}
