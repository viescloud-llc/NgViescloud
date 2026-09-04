import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesService } from '../../../../lib/service/rest.service';
import { OrderFulfillment } from '../../model/commerce.model';

export interface RestockRequestItem {
  orderFulfillmentItemId: string;
  /** Omit to restock everything still outstanding for the item. */
  quantity?: number;
}

export interface RestockRequest {
  items: RestockRequestItem[];
  reason?: string;
}

// POST /api/v1/orders/{id}/restock — back-office restock after a refund/return.
// Server writes one RETURN stock movement per item (ledger + balance together),
// tracks progress in order.metadata `restock.<itemId>`, and refuses to restock
// more than was sold or anything for an order whose stock never left.
// Gated on orders:restock OR inventory:update.
@Injectable({ providedIn: 'root' })
export class OrderRestockService {
  private http = inject(HttpClient);
  private baseUrl = `${ViesService.getUri()}/api/v1/orders`;

  restock(orderId: string, request: RestockRequest): Observable<OrderFulfillment> {
    return this.http.post<OrderFulfillment>(`${this.baseUrl}/${orderId}/restock`, request);
  }
}
