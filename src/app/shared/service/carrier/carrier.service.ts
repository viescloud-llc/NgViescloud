import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { Carrier } from '../../model/shipping.model';

// /api/v1/carriers — authority resource `shipping` (credentials round-trip, so
// read is a real grant). Server lower-cases code/integrationType and requires
// {tracking} in a tracking URL template.
@Injectable({ providedIn: 'root' })
export class CarrierService extends ViesRestService<Carrier> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'carriers'];
  }

  override newBlankObject(): Carrier {
    return new Carrier();
  }
  override getIdFieldValue(object: Carrier) {
    return object.id;
  }
  override setIdFieldValue(object: Carrier, id: any): void {
    object.id = id;
  }
}
