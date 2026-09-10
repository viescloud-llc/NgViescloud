import { Address } from "./address.model";
import { OrderFulfillment } from "./commerce.model";

// Request body for POST /api/v1/orders/checkout. Wraps cart validation, discount
// validation, stock pre-check, total computation, OrderFulfillment creation,
// library CheckoutOrder creation, and cart deactivation in one transaction.
export interface CheckoutRequest {
    cartId: string;                       // UUID of the Cart to check out
    shippingAddress: Address;
    billingAddress: Address;
    discountCode?: string;                // optional coupon code
    shippingRuleId?: string;              // buyer's pick from the shipping quote; absent = recommended method
    provider: string;                     // payment provider, e.g. 'paypal'
    returnUrl: string;                    // where the buyer is redirected after success
    cancelUrl: string;                    // where the buyer is redirected on cancel
}

export interface CheckoutResponse {
    orderFulfillment: OrderFulfillment;
    approveUrl: string;                   // hand to window.location to redirect to PayPal etc.
}

// Body for POST /api/v1/orders/shipping-quote — non-destructive, mirrors the discount preview.
export interface ShippingQuoteRequest {
    cartId: string;
    shippingAddress: Address;
}
