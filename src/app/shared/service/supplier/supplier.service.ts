import { Injectable } from '@angular/core';
import { ViesRestService } from '../../../../lib/service/rest.service';
import { Supplier } from '../../model/inventory.model';

// /api/v1/suppliers — authority resource `inventory`. Delete is refused (409)
// while purchase orders reference the supplier; mark it inactive instead.
@Injectable({ providedIn: 'root' })
export class SupplierService extends ViesRestService<Supplier> {
  protected override getPrefixes(): string[] { return ['api', 'v1', 'suppliers']; }
  override newBlankObject(): Supplier { return new Supplier(); }
  override getIdFieldValue(object: Supplier) { return object.id; }
  override setIdFieldValue(object: Supplier, id: any): void { object.id = id; }
}
