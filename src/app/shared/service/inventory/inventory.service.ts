import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesService } from '../../../../lib/service/rest.service';
import { DigestResult, InventoryLevel, LowStockRow, TransferRequest, TransferResult } from '../../model/inventory.model';

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

  /** inventory:update — two TRANSFER movements sharing a TRF-… reference. */
  transfer(req: TransferRequest): Observable<TransferResult> {
    return this.http.post<TransferResult>(`${this.baseUrl}/transfers`, req);
  }

  lowStock(warehouseId?: string | null, includeInactive = false): Observable<LowStockRow[]> {
    const params: Record<string, string> = { includeInactive: String(includeInactive) };
    if (warehouseId) params['warehouseId'] = warehouseId;
    return this.http.get<LowStockRow[]>(`${this.baseUrl}/low-stock`, { params });
  }

  lowStockSettings(): Observable<{ storeDefault: number }> {
    return this.http.get<{ storeDefault: number }>(`${this.baseUrl}/low-stock/settings`);
  }

  /** inventory:update — sends the digest now to the LOW_STOCK_DIGEST recipients (Settings → Email). */
  sendLowStockDigest(): Observable<DigestResult> {
    return this.http.post<DigestResult>(`${this.baseUrl}/low-stock/digest`, null);
  }
}
