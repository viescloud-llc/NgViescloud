import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { first, Observable } from 'rxjs';
import { ViesService } from '../../../../lib/service/rest.service';

// Read-models for the LIBRARY checkout module, typed per backend-openapi.json.
// Money fields (amountTotal, amountRefunded, unitPrice, subtotal, amount) are
// BigDecimal on the wire → JSON numbers; typed loose (string | number) since
// we only render them. Index signatures keep unknown additions visible in the
// generic payment panel rather than silently dropped.
//
// Note: CheckoutOrder has NO transaction list — the refund/capture/sync
// endpoints each return a single CheckoutTransaction, and there's no
// list-transactions-by-order endpoint in the spec. What the order DOES carry
// is `items` (CheckoutLineItem snapshot of what was purchased).
export interface CheckoutLineItemView {
  sku?: string;
  name?: string;
  description?: string;
  quantity?: number;
  unitPrice?: string | number;
  subtotal?: string | number;
  metadata?: Record<string, string>;
  [key: string]: unknown;
}

export interface CheckoutTransactionView {
  id?: string;
  orderId?: string;
  kind?: string;
  status?: string;
  amount?: string | number;
  currency?: string;
  reason?: string;
  providerTransactionId?: string;
  occurredAt?: unknown;
  [key: string]: unknown;
}

// Status enum per spec: CREATED | PENDING_APPROVAL | APPROVED | CAPTURED |
// FAILED | REFUNDED | PARTIALLY_REFUNDED | CANCELLED.
export interface CheckoutOrderView {
  id?: string;
  status?: string;
  currency?: string;
  kind?: string;
  provider?: string;
  providerOrderId?: string;
  amountTotal?: string | number;
  amountRefunded?: string | number;
  approveUrl?: string;
  capturedAt?: unknown;
  items?: CheckoutLineItemView[];
  metadata?: Record<string, string>;
  [key: string]: unknown;
}

// Client for the library checkout module's order endpoints:
//   GET  /api/v1/checkout/orders/{id}                                       → payment-side state
//   POST /api/v1/checkout/orders/{provider}/{orderId}/refund?amount=&reason= → refund (returns the refund CheckoutTransaction)
//
// Used by the order detail (read-only payment panel) and the returns editor
// (refund trigger). Refunds move real money — every call site must confirm
// with the admin first.
@Injectable({
  providedIn: 'root'
})
export class CheckoutOrderService {
  private http = inject(HttpClient);
  private baseUrl = `${ViesService.getUri()}/api/v1/checkout/orders`;

  get(checkoutOrderId: string): Observable<CheckoutOrderView> {
    return this.http.get<CheckoutOrderView>(`${this.baseUrl}/${checkoutOrderId}`).pipe(first());
  }

  refundPaypal(checkoutOrderId: string, amount?: string, reason?: string): Observable<CheckoutTransactionView> {
    let params = new HttpParams();
    if (amount) params = params.set('amount', amount);
    if (reason) params = params.set('reason', reason);
    return this.http.post<CheckoutTransactionView>(
      `${this.baseUrl}/paypal/${checkoutOrderId}/refund`, null, { params }
    ).pipe(first());
  }
}
