import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesService } from '../../../../lib/service/rest.service';
import { OrderFulfillment } from '../../model/commerce.model';
import { ManualOrderPreview, ManualOrderRequest, PaymentMethod } from '../../model/manual-order.model';

@Injectable({ providedIn: 'root' })
export class ManualOrderService {
  private http = inject(HttpClient);
  private baseUrl = `${ViesService.getUri()}/api/v1/orders`;

  preview(req: ManualOrderRequest): Observable<ManualOrderPreview> {
    return this.http.post<ManualOrderPreview>(`${this.baseUrl}/manual/preview`, req);
  }

  create(req: ManualOrderRequest): Observable<OrderFulfillment> {
    return this.http.post<OrderFulfillment>(`${this.baseUrl}/manual`, req);
  }

  /** MONEY (checkout:capture): record an offline payment on a PENDING manual order. */
  recordPayment(orderId: string, body: { paymentMethod: PaymentMethod; paymentReference?: string; amountTendered?: string; handedOver?: boolean }): Observable<OrderFulfillment> {
    return this.http.post<OrderFulfillment>(`${this.baseUrl}/${orderId}/payment/record`, body);
  }
}
