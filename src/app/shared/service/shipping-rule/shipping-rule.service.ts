import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { ShippingRule } from '../../model/commerce.model';

// Admin-gated. `currency` is DB-level unique (one rule per currency) → 409 on duplicate.
// Drives OrderFulfillment.shippingCost at checkout. Missing/inactive rule → orchestrator
// falls back to zero shipping with a warn-log.
@Injectable({
  providedIn: 'root'
})
export class ShippingRuleService extends ViesRestService<ShippingRule> {

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
}
