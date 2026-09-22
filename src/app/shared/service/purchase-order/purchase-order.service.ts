import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesService } from '../../../../lib/service/rest.service';
import { PurchaseOrder } from '../../model/inventory.model';

// /api/v1/purchase-orders — CRUD (DRAFT / ORDERED editable; received
// quantities are server-owned) plus lifecycle actions. Authority `inventory`.
@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private http = inject(HttpClient);
  private baseUrl = `${ViesService.getUri()}/api/v1/purchase-orders`;

  getAll(): Observable<PurchaseOrder[]> { return this.http.get<PurchaseOrder[]>(this.baseUrl); }
  open(supplierId?: string): Observable<PurchaseOrder[]> {
    return this.http.get<PurchaseOrder[]>(`${this.baseUrl}/open`, { params: supplierId ? { supplierId } : {} });
  }
  get(id: string): Observable<PurchaseOrder> { return this.http.get<PurchaseOrder>(`${this.baseUrl}/${id}`); }
  create(po: PurchaseOrder): Observable<PurchaseOrder> { return this.http.post<PurchaseOrder>(this.baseUrl, po); }
  update(id: string, po: PurchaseOrder): Observable<PurchaseOrder> { return this.http.put<PurchaseOrder>(`${this.baseUrl}/${id}`, po); }
  delete(id: string): Observable<void> { return this.http.delete<void>(`${this.baseUrl}/${id}`); }

  place(id: string): Observable<PurchaseOrder> { return this.http.post<PurchaseOrder>(`${this.baseUrl}/${id}/place`, null); }
  /** lines: lineId → qty; empty = receive everything outstanding. Writes PURCHASE movements. */
  receive(id: string, lines: Record<string, number>, note?: string): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.baseUrl}/${id}/receive`, { lines, note: note || undefined });
  }
  receiveScan(id: string, code: string, quantity = 1): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.baseUrl}/${id}/receive-scan`, { code, quantity });
  }
  cancel(id: string, reason?: string): Observable<PurchaseOrder> { return this.http.post<PurchaseOrder>(`${this.baseUrl}/${id}/cancel`, { reason: reason || undefined }); }
  close(id: string): Observable<PurchaseOrder> { return this.http.post<PurchaseOrder>(`${this.baseUrl}/${id}/close`, null); }
}
