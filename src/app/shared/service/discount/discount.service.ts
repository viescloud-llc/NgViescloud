import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { Discount } from '../../model/commerce.model';

// Admin-gated. `code` is unique → 409 on duplicate.
// `currentUses` is denormalized — increment server-side, never PATCH from the UI.
@Injectable({
  providedIn: 'root'
})
export class DiscountService extends ViesRestService<Discount> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'discounts'];
  }

  override newBlankObject(): Discount {
    return new Discount();
  }
  override getIdFieldValue(object: Discount) {
    return object.id;
  }
  override setIdFieldValue(object: Discount, id: any): void {
    object.id = id;
  }
}
