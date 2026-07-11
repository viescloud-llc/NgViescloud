// Request body for POST /api/v1/discounts/validate. Non-destructive coupon preview
// for the "Apply code" UX. Always returns 200 — business rejections come back in the
// body, not as exceptions.
export interface DiscountValidationRequest {
    code: string;
    cartId: string;
}

export interface DiscountValidationResponse {
    valid: boolean;
    discountAmount: string | null;   // BigDecimal-as-string when valid; null when rejected
    reason: string | null;           // null when valid; human-readable rejection reason otherwise
}
