import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { Tag } from '../../model/product.model';

@Injectable({
  providedIn: 'root'
})
export class TagService extends ViesRestService<Tag> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'tags'];
  }

  override newBlankObject(): Tag {
    return new Tag();
  }
  override getIdFieldValue(object: Tag) {
    return object.id;
  }
  override setIdFieldValue(object: Tag, id: any): void {
    object.id = id;
  }
}
