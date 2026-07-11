import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { OrderFulfillmentItem } from '../../model/commerce.model';

// Admin-gated. `productSnapshot` and `lineItemSku` are stamped server-side at order
// creation; treat as read-only from the UI. Prefer managing items through the parent
// OrderFulfillment.
@Injectable({
  providedIn: 'root'
})
export class OrderFulfillmentItemService extends ViesRestService<OrderFulfillmentItem> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'order', 'items'];
  }

  override newBlankObject(): OrderFulfillmentItem {
    return new OrderFulfillmentItem();
  }
  override getIdFieldValue(object: OrderFulfillmentItem) {
    return object.id;
  }
  override setIdFieldValue(object: OrderFulfillmentItem, id: any): void {
    object.id = id;
  }
}
