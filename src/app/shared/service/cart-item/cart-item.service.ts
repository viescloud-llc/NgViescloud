import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { CartItem } from '../../model/commerce.model';

// Admin-gated. Prefer managing items through the parent Cart (orphanRemoval is on);
// this service exists for granular debugging.
@Injectable({
  providedIn: 'root'
})
export class CartItemService extends ViesRestService<CartItem> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'cart', 'items'];
  }

  override newBlankObject(): CartItem {
    return new CartItem();
  }
  override getIdFieldValue(object: CartItem) {
    return object.id;
  }
  override setIdFieldValue(object: CartItem, id: any): void {
    object.id = id;
  }
}
