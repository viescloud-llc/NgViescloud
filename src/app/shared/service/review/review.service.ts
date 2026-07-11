import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { Review } from '../../model/user-info.model';

// Admin-gated today. Migrating to user-scoped (so shoppers can write/edit their own) needs
// a backend change: extend Review to TrackedTimeStampUserAccess, then switch the controller
// to ViesControllerWithUserAccess. Until then, this service is admin-only.
@Injectable({
  providedIn: 'root'
})
export class ReviewService extends ViesRestService<Review> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'reviews'];
  }

  override newBlankObject(): Review {
    return new Review();
  }
  override getIdFieldValue(object: Review) {
    return object.id;
  }
  override setIdFieldValue(object: Review, id: any): void {
    object.id = id;
  }
}
