import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesService } from '../../../../lib/service/rest.service';
import { DigitalAsset } from '../../model/product.model';

// Staff management of a DIGITAL variant's files —
// /api/v1/product/variants/{variantId}/digital-assets (catalog:* authorities).
// Upload is multipart (the backend streams the bytes into object storage under
// the uploading admin); label/active/sortOrder are patched as JSON. `download`
// returns the raw blob for a staff preview.
@Injectable({ providedIn: 'root' })
export class DigitalAssetService {
  private http = inject(HttpClient);

  private base(variantId: string): string {
    return `${ViesService.getUri()}/api/v1/product/variants/${variantId}/digital-assets`;
  }

  list(variantId: string): Observable<DigitalAsset[]> {
    return this.http.get<DigitalAsset[]>(this.base(variantId));
  }

  upload(variantId: string, file: File | Blob, fileName: string, label?: string): Observable<DigitalAsset> {
    const form = new FormData();
    form.append('file', file, fileName);
    if (label?.trim()) form.append('label', label.trim());
    return this.http.post<DigitalAsset>(this.base(variantId), form);
  }

  patch(variantId: string, assetId: string, patch: Partial<Pick<DigitalAsset, 'label' | 'active' | 'sortOrder'>>): Observable<DigitalAsset> {
    return this.http.patch<DigitalAsset>(`${this.base(variantId)}/${assetId}`, patch);
  }

  delete(variantId: string, assetId: string): Observable<void> {
    return this.http.delete<void>(`${this.base(variantId)}/${assetId}`);
  }

  download(variantId: string, assetId: string): Observable<Blob> {
    return this.http.get(`${this.base(variantId)}/${assetId}/download`, { responseType: 'blob' });
  }
}
