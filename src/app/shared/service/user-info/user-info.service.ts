import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { UserInfo } from '../../model/user-info.model';

// Admin-gated today. Note: the path variable {id} IS the user's UUID — UserInfo has no
// separate `id` field, only `userId`. A user self-service controller is a pending backend feature.
@Injectable({
  providedIn: 'root'
})
export class UserInfoService extends ViesRestService<UserInfo> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'user', 'infos'];
  }

  override newBlankObject(): UserInfo {
    return new UserInfo();
  }
  override getIdFieldValue(object: UserInfo) {
    return object.userId;
  }
  override setIdFieldValue(object: UserInfo, id: any): void {
    object.userId = id;
  }
}
