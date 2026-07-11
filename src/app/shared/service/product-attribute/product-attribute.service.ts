import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { ProductAttribute } from '../../model/attribute.model';

@Injectable({
  providedIn: 'root'
})
export class ProductAttributeService extends ViesRestService<ProductAttribute> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'product', 'attributes'];
  }

  override newBlankObject(): ProductAttribute {
    return new ProductAttribute();
  }
  override getIdFieldValue(object: ProductAttribute) {
    return object.id;
  }
  override setIdFieldValue(object: ProductAttribute, id: any): void {
    object.id = id;
  }
}
