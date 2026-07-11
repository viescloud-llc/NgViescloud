import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesService } from '../../../../lib/service/rest.service';
import { OrderFulfillment } from '../../model/commerce.model';
import { CheckoutRequest, CheckoutResponse } from '../../model/checkout.model';

// Custom orchestration controller — NOT CRUD. Lives at the same `/api/v1/orders` base path
// as `OrderFulfillmentController` (Spring routes by full URL + verb so they don't collide).
//
// Two endpoints:
//   POST /api/v1/orders/checkout                 — kicks off checkout, returns approveUrl
//   POST /api/v1/orders/{id}/complete            — captures payment, decrements stock,
//                                                  flips fulfillment to PROCESSING
//
// Errors per spec: 400 (validation), 403 (cart not owned), 404 (cart missing),
//                  503 (PayPal not configured).
@Injectable({
  providedIn: 'root'
})
export class CheckoutOrchestratorService {
  private http = inject(HttpClient);
  private baseUrl = `${ViesService.getUri()}/api/v1/orders`;

  checkout(request: CheckoutRequest): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.baseUrl}/checkout`, request);
  }

  complete(orderFulfillmentId: string): Observable<OrderFulfillment> {
    return this.http.post<OrderFulfillment>(`${this.baseUrl}/${orderFulfillmentId}/complete`, {});
  }
}
