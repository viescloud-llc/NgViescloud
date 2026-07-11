import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesService } from '../../../../lib/service/rest.service';
import { TaxRule } from '../../model/commerce.model';

export type TaxRuleImportMode = 'append' | 'replace';

export interface TaxRuleImportResponse {
    imported: number;
    replaced: number;
    mode: TaxRuleImportMode;
}

// Export / import endpoints for TaxRule. NOT covered by ViesRestService since they
// fall outside the seven-verb CRUD shape; also NOT covered by the framework admin
// gate (the underlying CRUD endpoints are admin-gated, these two are not). The
// production deployment MUST gate these paths at the reverse proxy.
//
//   GET  /api/v1/tax/rules/export          → TaxRule[] (download as JSON)
//   POST /api/v1/tax/rules/import?mode=… → { imported, replaced, mode }
//
// Import body: a JSON array of TaxRule. `id`, `createdAt`, `updatedAt` are ignored
// server-side — every imported rule gets a fresh UUID.
//   mode=append (default): inserts only, existing rules untouched.
//   mode=replace:         deletes every existing rule first, then inserts.
//                         Transactional — any rule failing validation rolls back.
@Injectable({
  providedIn: 'root'
})
export class TaxRuleImportExportService {
  private http = inject(HttpClient);
  private baseUrl = `${ViesService.getUri()}/api/v1/tax/rules`;

  exportRules(): Observable<TaxRule[]> {
    return this.http.get<TaxRule[]>(`${this.baseUrl}/export`);
  }

  importRules(rules: TaxRule[], mode: TaxRuleImportMode = 'append'): Observable<TaxRuleImportResponse> {
    const params = new HttpParams().set('mode', mode);
    return this.http.post<TaxRuleImportResponse>(`${this.baseUrl}/import`, rules, { params });
  }
}
