import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { Category } from '../../model/product.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService extends ViesRestService<Category> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'categories'];
  }

  override newBlankObject(): Category {
    return new Category();
  }
  override getIdFieldValue(object: Category) {
    return object.id;
  }
  override setIdFieldValue(object: Category, id: any): void {
    object.id = id;
  }
}
