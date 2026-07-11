import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { Cart } from '../../model/commerce.model';

// User-scoped on the backend (ViesControllerWithUserAccess).
// `userId` and `ownerUserId` are server-stamped on POST — never set them from the UI.
@Injectable({
  providedIn: 'root'
})
export class CartService extends ViesRestService<Cart> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'carts'];
  }

  override newBlankObject(): Cart {
    return new Cart();
  }
  override getIdFieldValue(object: Cart) {
    return object.id;
  }
  override setIdFieldValue(object: Cart, id: any): void {
    object.id = id;
  }
}
