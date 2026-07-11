import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { Shipment } from '../../model/commerce.model';

// Admin-gated. `trackingNumber` is unique → 409 on duplicate.
// Both `estimatedDeliveryDate` and `actualDeliveryDate` are NOT NULL — UI must supply both on create.
@Injectable({
  providedIn: 'root'
})
export class ShipmentService extends ViesRestService<Shipment> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'shipments'];
  }

  override newBlankObject(): Shipment {
    return new Shipment();
  }
  override getIdFieldValue(object: Shipment) {
    return object.id;
  }
  override setIdFieldValue(object: Shipment, id: any): void {
    object.id = id;
  }
}
