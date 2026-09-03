import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesService } from '../../../../lib/service/rest.service';
import { GenerateVariantsRequest, GenerateVariantsResponse } from '../../model/product.model';

// Custom (non-CRUD) endpoint next to the products CRUD controller — same
// base-path-sharing pattern as CheckoutOrchestratorService. Admin-gated
// server-side; the generator is idempotent (existing SKUs are skipped), so
// re-running after adding options only creates the new combinations.
@Injectable({
  providedIn: 'root'
})
export class VariantGeneratorService {
  private http = inject(HttpClient);
  private baseUrl = `${ViesService.getUri()}/api/v1/products`;

  generate(productId: string, request: GenerateVariantsRequest): Observable<GenerateVariantsResponse> {
    return this.http.post<GenerateVariantsResponse>(`${this.baseUrl}/${productId}/generate-variants`, request);
  }
}
