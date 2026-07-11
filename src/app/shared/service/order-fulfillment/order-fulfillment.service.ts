import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { OrderFulfillment } from '../../model/commerce.model';

// User-scoped on the backend (ViesControllerWithUserAccess). `/api/v1/orders` is the same
// base path as before; the CRUD controller coexists with the checkout orchestrator
// (POST /api/v1/orders/checkout, POST /api/v1/orders/{id}/complete) — Spring routes by
// full URL + verb, no collision.
//
// `userId`/`ownerUserId`, `orderNumber`, `checkoutOrderId`, and the system keys in
// `metadata` (checkout.*, discount.*, tax.*, shipping.*) are all server-managed.
// `currency` is denormalized at checkout time. Don't set them from the UI.
@Injectable({
  providedIn: 'root'
})
export class OrderFulfillmentService extends ViesRestService<OrderFulfillment> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'orders'];
  }

  override newBlankObject(): OrderFulfillment {
    return new OrderFulfillment();
  }
  override getIdFieldValue(object: OrderFulfillment) {
    return object.id;
  }
  override setIdFieldValue(object: OrderFulfillment, id: any): void {
    object.id = id;
  }
}
