import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesService } from '../../../../lib/service/rest.service';
import { BulkProductRequest, BulkProductResult, ImportResult } from '../../model/bulk.model';
import { ShippingRule } from '../../model/commerce.model';
import { TaxRuleImportMode, TaxRuleImportResponse } from '../tax-rule-import-export/tax-rule-import-export.service';

export type StockImportMode = 'set' | 'add';

// CSV export / import (all-or-nothing, dry-run first) for products+variants,
// stock levels and discounts; JSON export / import for shipping methods (tax-rule
// pattern); bulk product actions. Authorities: catalog / inventory / discounts / rules.
@Injectable({ providedIn: 'root' })
export class ImportExportService {
  private http = inject(HttpClient);
  private base = `${ViesService.getUri()}/api/v1`;

  exportProductsCsv(): Observable<string> { return this.http.get(`${this.base}/products/export.csv`, { responseType: 'text' }); }
  importProductsCsv(csv: string, dryRun: boolean): Observable<ImportResult> {
    return this.http.post<ImportResult>(`${this.base}/products/import.csv`, csv, { params: { dryRun }, headers: { 'Content-Type': 'text/csv' } });
  }

  exportStockCsv(): Observable<string> { return this.http.get(`${this.base}/stock/export.csv`, { responseType: 'text' }); }
  importStockCsv(csv: string, dryRun: boolean, mode: StockImportMode, reason?: string): Observable<ImportResult> {
    let params = new HttpParams().set('dryRun', dryRun).set('mode', mode);
    if (reason) params = params.set('reason', reason);
    return this.http.post<ImportResult>(`${this.base}/stock/import.csv`, csv, { params, headers: { 'Content-Type': 'text/csv' } });
  }

  exportDiscountsCsv(): Observable<string> { return this.http.get(`${this.base}/discounts/export.csv`, { responseType: 'text' }); }
  importDiscountsCsv(csv: string, dryRun: boolean): Observable<ImportResult> {
    return this.http.post<ImportResult>(`${this.base}/discounts/import.csv`, csv, { params: { dryRun }, headers: { 'Content-Type': 'text/csv' } });
  }

  exportShippingRules(): Observable<ShippingRule[]> { return this.http.get<ShippingRule[]>(`${this.base}/shipping/rules/export`); }
  importShippingRules(rules: ShippingRule[], mode: TaxRuleImportMode = 'append'): Observable<TaxRuleImportResponse> {
    return this.http.post<TaxRuleImportResponse>(`${this.base}/shipping/rules/import`, rules, { params: { mode } });
  }

  bulkProducts(req: BulkProductRequest): Observable<BulkProductResult> {
    return this.http.post<BulkProductResult>(`${this.base}/products/bulk`, req);
  }
}
