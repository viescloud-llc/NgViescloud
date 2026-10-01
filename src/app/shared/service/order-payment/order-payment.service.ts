import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesService } from '../../../../lib/service/rest.service';
import { OrderFulfillment, ReturnRequest } from '../../model/commerce.model';
import { CheckoutOrderView, CheckoutTransactionView } from '../checkout-order/checkout-order.service';

// MONEY. Staff payment actions on an order — /api/v1/orders/{id}/payment/*,
// each behind its own checkout:* authority (read / refund / capture / cancel /
// sync). The server validates the refundable amount, snapshots refund.* /
// cancel.* metadata and lets the webhook listener move the order status.
export interface PaymentView {
  order: OrderFulfillment;
  checkoutOrder?: CheckoutOrderView | null;
  transactions: CheckoutTransactionView[];
  amountTotal?: string | number | null;
  amountRefunded?: string | number | null;
  amountRefundable?: string | number | null;
  canCapture: boolean;
  canRefund: boolean;
  canCancel: boolean;
  canRecordPayment?: boolean;
}

export interface ReturnRefundResult {
  returnRequest: ReturnRequest;
  payment: PaymentView;
  transaction?: CheckoutTransactionView | null;
}

@Injectable({ providedIn: 'root' })
export class OrderPaymentService {
  private http = inject(HttpClient);
  private orders = `${ViesService.getUri()}/api/v1/orders`;
  private returns = `${ViesService.getUri()}/api/v1/returns`;

  view(orderId: string): Observable<PaymentView> {
    return this.http.get<PaymentView>(`${this.orders}/${orderId}/payment`);
  }

  /** amount omitted = everything still refundable. */
  refund(orderId: string, amount: string | undefined, reason: string): Observable<PaymentView> {
    return this.http.post<PaymentView>(`${this.orders}/${orderId}/payment/refund`, { amount: amount || null, reason });
  }

  capture(orderId: string): Observable<PaymentView> {
    return this.http.post<PaymentView>(`${this.orders}/${orderId}/payment/capture`, null);
  }

  cancel(orderId: string, reason: string): Observable<PaymentView> {
    return this.http.post<PaymentView>(`${this.orders}/${orderId}/payment/cancel`, { reason });
  }

  sync(orderId: string): Observable<PaymentView> {
    return this.http.post<PaymentView>(`${this.orders}/${orderId}/payment/sync`, null);
  }

  /** Refund a return in one step: amount from the request, status → REFUNDED. */
  refundReturn(returnId: string, wholeOrder = false): Observable<ReturnRefundResult> {
    return this.http.post<ReturnRefundResult>(`${this.returns}/${returnId}/refund${wholeOrder ? '?wholeOrder=true' : ''}`, null);
  }
}
