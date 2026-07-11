import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { ProductVariantAttribute } from '../../model/attribute.model';

@Injectable({
  providedIn: 'root'
})
export class ProductVariantAttributeService extends ViesRestService<ProductVariantAttribute> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'product', 'variant', 'attributes'];
  }

  override newBlankObject(): ProductVariantAttribute {
    return new ProductVariantAttribute();
  }
  override getIdFieldValue(object: ProductVariantAttribute) {
    return object.id;
  }
  override setIdFieldValue(object: ProductVariantAttribute, id: any): void {
    object.id = id;
  }
}
