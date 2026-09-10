import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesService } from '../../../../lib/service/rest.service';
import { ProductVariantScanCode, ScanLookupResult } from '../../model/scan-code.model';

// Scan codes — alias CRUD under a variant (catalog:*) and the lookup any
// scanner-driven screen calls (variant id or alias text → matches).
@Injectable({ providedIn: 'root' })
export class ScanCodeService {
  private http = inject(HttpClient);
  private baseUrl = `${ViesService.getUri()}/api/v1/product/variants`;

  lookup(code: string): Observable<ScanLookupResult> {
    return this.http.get<ScanLookupResult>(`${this.baseUrl}/by-code/${encodeURIComponent(code.trim())}`);
  }

  list(variantId: string): Observable<ProductVariantScanCode[]> {
    return this.http.get<ProductVariantScanCode[]>(`${this.baseUrl}/${variantId}/scan-codes`);
  }

  add(variantId: string, code: Partial<ProductVariantScanCode>): Observable<ProductVariantScanCode> {
    return this.http.post<ProductVariantScanCode>(`${this.baseUrl}/${variantId}/scan-codes`, code);
  }

  patch(variantId: string, codeId: string, patch: Partial<ProductVariantScanCode>): Observable<ProductVariantScanCode> {
    return this.http.patch<ProductVariantScanCode>(`${this.baseUrl}/${variantId}/scan-codes/${codeId}`, patch);
  }

  delete(variantId: string, codeId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${variantId}/scan-codes/${codeId}`);
  }
}
