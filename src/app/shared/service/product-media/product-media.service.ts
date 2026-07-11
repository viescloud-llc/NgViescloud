import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { ProductMedia } from '../../model/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductMediaService extends ViesRestService<ProductMedia> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'product', 'medias'];
  }

  override newBlankObject(): ProductMedia {
    return new ProductMedia();
  }
  override getIdFieldValue(object: ProductMedia) {
    return object.id;
  }
  override setIdFieldValue(object: ProductMedia, id: any): void {
    object.id = id;
  }
}
