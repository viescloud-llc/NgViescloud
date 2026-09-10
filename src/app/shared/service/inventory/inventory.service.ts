import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesService } from '../../../../lib/service/rest.service';
import { InventoryLevel } from '../../model/inventory.model';

// Read side of stock-per-warehouse (/api/v1/inventory, inventory:read).
// Writes go through StockMovementService with a warehouse on the movement.
@Injectable({ providedIn: 'root' })
export class InventoryService {
  private http = inject(HttpClient);
  private baseUrl = `${ViesService.getUri()}/api/v1/inventory`;

  levelsForVariant(variantId: string): Observable<InventoryLevel[]> {
    return this.http.get<InventoryLevel[]>(`${this.baseUrl}/variants/${variantId}`);
  }

  levelsInWarehouse(warehouseId: string): Observable<InventoryLevel[]> {
    return this.http.get<InventoryLevel[]>(`${this.baseUrl}/warehouses/${warehouseId}`);
  }
}
