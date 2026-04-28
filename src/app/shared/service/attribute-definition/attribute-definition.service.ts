import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { AttributeDefinition } from '../../model/product.model';

@Injectable({
  providedIn: 'root'
})
export class AttributeDefinitionService extends ViesRestService<AttributeDefinition> {

  override newBlankObject(): AttributeDefinition {
    return new AttributeDefinition();
  }
  override getIdFieldValue(object: AttributeDefinition) {
    return object.id;
  }
  override setIdFieldValue(object: AttributeDefinition, id: any): void {
    object.id = id;
  }
  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'product', 'attribute', 'definitions'];
  }

}
