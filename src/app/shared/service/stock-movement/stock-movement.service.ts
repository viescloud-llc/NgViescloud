import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { StockMovement } from '../../model/commerce.model';

// Admin-gated. Append-only audit log — adjustments create new rows.
// Never PATCH `quantityAfter`; it's a denormalized running total set server-side.
@Injectable({
  providedIn: 'root'
})
export class StockMovementService extends ViesRestService<StockMovement> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'stock', 'movements'];
  }

  override newBlankObject(): StockMovement {
    return new StockMovement();
  }
  override getIdFieldValue(object: StockMovement) {
    return object.id;
  }
  override setIdFieldValue(object: StockMovement, id: any): void {
    object.id = id;
  }
}
