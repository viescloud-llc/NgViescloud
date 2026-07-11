import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { TaxRule } from '../../model/commerce.model';

// Admin-gated CRUD. Note: this entity also exposes /export and /import endpoints that
// DO NOT inherit the framework admin gate — gate those at the reverse proxy. The
// /export and /import calls are not modeled here; add custom HttpClient methods or a
// separate service when needed.
@Injectable({
  providedIn: 'root'
})
export class TaxRuleService extends ViesRestService<TaxRule> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'tax', 'rules'];
  }

  override newBlankObject(): TaxRule {
    return new TaxRule();
  }
  override getIdFieldValue(object: TaxRule) {
    return object.id;
  }
  override setIdFieldValue(object: TaxRule, id: any): void {
    object.id = id;
  }
}
