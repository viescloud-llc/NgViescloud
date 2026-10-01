import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesRestService, ViesService } from '../../../../lib/service/rest.service';
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

  private http = inject(HttpClient);

  // MONEY (carrier account). POST /shipments/{id}/buy-label — shipments:update.
  // Buys the label through the shipment's carrier integration (EasyPost) and
  // returns the shipment with the label block filled in. Idempotent server-side.
  buyLabel(id: string): Observable<Shipment> {
    return this.http.post<Shipment>(`${ViesService.getUri()}/api/v1/shipments/${id}/buy-label`, {});
  }
}
