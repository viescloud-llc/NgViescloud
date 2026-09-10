import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesService } from '../../../../lib/service/rest.service';
import { DigitalDownloadView } from '../../model/commerce.model';

// Digital downloads on an order — /api/v1/orders/{orderId}/downloads.
// `list`/`download` are for the order's buyer (staff with orders:manage pass
// too); `grant`/`revoke`/`restore` are staff overrides. Downloads come back as
// a blob with the server's Content-Disposition file name.
@Injectable({ providedIn: 'root' })
export class DigitalDownloadService {
  private http = inject(HttpClient);
  private baseUrl = `${ViesService.getUri()}/api/v1/orders`;

  list(orderId: string): Observable<DigitalDownloadView[]> {
    return this.http.get<DigitalDownloadView[]>(`${this.baseUrl}/${orderId}/downloads`);
  }

  download(orderId: string, entitlementId: string, assetId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${orderId}/downloads/${entitlementId}/assets/${assetId}`, { responseType: 'blob' });
  }

  /** Staff: mint any missing entitlements on a paid order (optionally mailing the buyer). */
  grant(orderId: string, notify: boolean = false): Observable<DigitalDownloadView[]> {
    const params = new HttpParams().set('notify', String(notify));
    return this.http.post<DigitalDownloadView[]>(`${this.baseUrl}/${orderId}/downloads/grant`, null, { params });
  }

  revoke(orderId: string, entitlementId: string, reason?: string): Observable<DigitalDownloadView> {
    let params = new HttpParams();
    if (reason?.trim()) params = params.set('reason', reason.trim());
    return this.http.post<DigitalDownloadView>(`${this.baseUrl}/${orderId}/downloads/${entitlementId}/revoke`, null, { params });
  }

  restore(orderId: string, entitlementId: string): Observable<DigitalDownloadView> {
    return this.http.post<DigitalDownloadView>(`${this.baseUrl}/${orderId}/downloads/${entitlementId}/restore`, null);
  }
}
