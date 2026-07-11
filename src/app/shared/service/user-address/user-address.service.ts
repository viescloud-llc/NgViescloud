import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { UserAddress } from '../../model/user-info.model';

// Admin-gated today. The path variable {id} IS the user's UUID — UserAddress is keyed on
// `userId` and has no separate `id` field. `addresses` is a Set<Address>; to add/remove one
// PUT the whole row with the full updated set. A user self-service controller is pending.
@Injectable({
  providedIn: 'root'
})
export class UserAddressService extends ViesRestService<UserAddress> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'user', 'addresses'];
  }

  override newBlankObject(): UserAddress {
    return new UserAddress();
  }
  override getIdFieldValue(object: UserAddress) {
    return object.userId;
  }
  override setIdFieldValue(object: UserAddress, id: any): void {
    object.userId = id;
  }
}
