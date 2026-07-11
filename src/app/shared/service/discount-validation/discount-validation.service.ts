import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesService } from '../../../../lib/service/rest.service';
import { DiscountValidationRequest, DiscountValidationResponse } from '../../model/discount-validation.model';

// Custom controller — NOT CRUD. Lives at the same `/api/v1/discounts` base as
// `DiscountController` (Spring routes by full URL + verb).
//
// `validate(code, cartId)` always returns 200; check `response.valid` and read
// `response.reason` to surface business rejections.
//
// Real HTTP errors are reserved for auth (401) or cart-not-found (404).
@Injectable({
  providedIn: 'root'
})
export class DiscountValidationService {
  private http = inject(HttpClient);
  private baseUrl = `${ViesService.getUri()}/api/v1/discounts`;

  validate(request: DiscountValidationRequest): Observable<DiscountValidationResponse> {
    return this.http.post<DiscountValidationResponse>(`${this.baseUrl}/validate`, request);
  }
}
