import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { Product } from '../../model/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService extends ViesRestService<Product> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'products'];
  }

  override newBlankObject(): Product {
    return new Product();
  }
  override getIdFieldValue(object: Product) {
    return object.id;
  }
  override setIdFieldValue(object: Product, id: any): void {
    object.id = id;
  }
}
