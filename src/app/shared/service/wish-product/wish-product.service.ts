import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { WishProduct } from '../../model/user-info.model';

// User-scoped on the backend (ViesControllerWithUserAccess).
// `productId` is a plain UUID column (not a FK relationship) — the UI must resolve it
// against the product catalog to render.
@Injectable({
  providedIn: 'root'
})
export class WishProductService extends ViesRestService<WishProduct> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'wishlists'];
  }

  override newBlankObject(): WishProduct {
    return new WishProduct();
  }
  override getIdFieldValue(object: WishProduct) {
    return object.id;
  }
  override setIdFieldValue(object: WishProduct, id: any): void {
    object.id = id;
  }
}
