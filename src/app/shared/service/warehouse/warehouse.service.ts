import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { Warehouse } from '../../model/inventory.model';

// /api/v1/warehouses — authority resource `inventory`. Server keeps exactly
// one default (flagging a new default clears the old one) and upper-cases code.
@Injectable({ providedIn: 'root' })
export class WarehouseService extends ViesRestService<Warehouse> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'warehouses'];
  }

  override newBlankObject(): Warehouse {
    return new Warehouse();
  }
  override getIdFieldValue(object: Warehouse) {
    return object.id;
  }
  override setIdFieldValue(object: Warehouse, id: any): void {
    object.id = id;
  }
}
