import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesRestService, ViesService } from '../../../../lib/service/rest.service';
import { ShippingQuote, ShippingRule, ShippingTestRequest } from '../../model/commerce.model';

// Shipping METHODS (rules) — /api/v1/shipping/rules, authority resource `rules`.
// Server validates per strategy on save (400 naming the problem). `quote`
// prices a synthetic cart for the admin test pad (rules:read).
@Injectable({
  providedIn: 'root'
})
export class ShippingRuleService extends ViesRestService<ShippingRule> {
  private http = inject(HttpClient);

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'shipping', 'rules'];
  }

  override newBlankObject(): ShippingRule {
    return new ShippingRule();
  }
  override getIdFieldValue(object: ShippingRule) {
    return object.id;
  }
  override setIdFieldValue(object: ShippingRule, id: any): void {
    object.id = id;
  }

  quote(request: ShippingTestRequest): Observable<ShippingQuote> {
    return this.http.post<ShippingQuote>(`${ViesService.getUri()}/api/v1/shipping/rules/quote`, request);
  }
}
