import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { ReturnRequest } from '../../model/commerce.model';

// User-scoped on the backend (ViesControllerWithUserAccess).
// `returnNumber` should be server-generated; status transitions are not enforced server-side,
// so the UI must guard the RMA lifecycle.
@Injectable({
  providedIn: 'root'
})
export class ReturnRequestService extends ViesRestService<ReturnRequest> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'returns'];
  }

  override newBlankObject(): ReturnRequest {
    return new ReturnRequest();
  }
  override getIdFieldValue(object: ReturnRequest) {
    return object.id;
  }
  override setIdFieldValue(object: ReturnRequest, id: any): void {
    object.id = id;
  }
}
