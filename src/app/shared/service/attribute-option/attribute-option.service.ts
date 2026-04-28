import { Injectable } from '@angular/core';
import { AttributeOption } from '../../model/product.model';
import { ViesRestService } from '../../../../lib/service/rest.service';

@Injectable({
  providedIn: 'root'
})
export class AttributeOptionService extends ViesRestService<AttributeOption> {

  override newBlankObject(): AttributeOption {
    return new AttributeOption();
  }
  override getIdFieldValue(object: AttributeOption) {
    return object.id;
  }
  override setIdFieldValue(object: AttributeOption, id: any): void {
    object.id = id;
  }
  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'product', 'attribute', 'options'];
  }
}
