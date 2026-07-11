import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { ProductVariant } from '../../model/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductVariantService extends ViesRestService<ProductVariant> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'product', 'variants'];
  }

  override newBlankObject(): ProductVariant {
    return new ProductVariant();
  }
  override getIdFieldValue(object: ProductVariant) {
    return object.id;
  }
  override setIdFieldValue(object: ProductVariant, id: any): void {
    object.id = id;
  }
}
