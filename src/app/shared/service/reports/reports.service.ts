import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesService } from '../../../../lib/service/rest.service';
import {
  CustomersReport,
  GeographyGroupBy,
  GeographyReport,
  OrderExportReport,
  OrderStatusReport,
  RefundsReport,
  ReportPeriodParams,
  SalesSummaryReport,
  SalesTimeseriesBucket,
  SalesTimeseriesReport,
  TaxReport,
  TopCategoriesReport,
  TopOrderedBy,
  TopProductsReport
} from '../../model/report.model';

// Read-only analytics over `OrderFulfillment` for dashboards and tax filing. All
// endpoints take ISO-8601 `from` and `to` query params; all responses split by
// currency (multi-currency tenants can't sum dollars + euros). The frontend owns
// chart rendering — these endpoints return raw JSON only.
//
// Auth note: `/api/v1/reports/*` does NOT inherit the framework admin gate; the
// production deployment must gate this path at the reverse proxy.
//
// Performance note: filtering is in-memory server-side (load orders → prune by
// date → aggregate). Fine up to hundreds of thousands of orders. Flag if load
// grows beyond that.
@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private http = inject(HttpClient);
  private baseUrl = `${ViesService.getUri()}/api/v1/reports`;

  tax(period: ReportPeriodParams): Observable<TaxReport> {
    return this.http.get<TaxReport>(`${this.baseUrl}/tax`, { params: this.period(period) });
  }

  salesSummary(period: ReportPeriodParams): Observable<SalesSummaryReport> {
    return this.http.get<SalesSummaryReport>(`${this.baseUrl}/sales/summary`, { params: this.period(period) });
  }

  salesTimeseries(period: ReportPeriodParams, bucket: SalesTimeseriesBucket = 'day'): Observable<SalesTimeseriesReport> {
    return this.http.get<SalesTimeseriesReport>(`${this.baseUrl}/sales/timeseries`, {
      params: this.period(period).set('bucket', bucket)
    });
  }

  topProducts(period: ReportPeriodParams, by: TopOrderedBy = 'revenue', limit = 10): Observable<TopProductsReport> {
    return this.http.get<TopProductsReport>(`${this.baseUrl}/products/top`, {
      params: this.period(period).set('by', by).set('limit', String(limit))
    });
  }

  topCategories(period: ReportPeriodParams, by: TopOrderedBy = 'revenue', limit = 10): Observable<TopCategoriesReport> {
    return this.http.get<TopCategoriesReport>(`${this.baseUrl}/categories/top`, {
      params: this.period(period).set('by', by).set('limit', String(limit))
    });
  }

  geography(period: ReportPeriodParams, groupBy: GeographyGroupBy = 'country'): Observable<GeographyReport> {
    return this.http.get<GeographyReport>(`${this.baseUrl}/geography`, {
      params: this.period(period).set('groupBy', groupBy)
    });
  }

  orderStatus(period: ReportPeriodParams): Observable<OrderStatusReport> {
    return this.http.get<OrderStatusReport>(`${this.baseUrl}/orders/status`, { params: this.period(period) });
  }

  refunds(period: ReportPeriodParams): Observable<RefundsReport> {
    return this.http.get<RefundsReport>(`${this.baseUrl}/refunds`, { params: this.period(period) });
  }

  customers(period: ReportPeriodParams, limit?: number): Observable<CustomersReport> {
    let params = this.period(period);
    if (limit !== undefined) params = params.set('limit', String(limit));
    return this.http.get<CustomersReport>(`${this.baseUrl}/customers/summary`, { params });
  }

  // Raw paginated export — `size` defaults server-side to 100, capped at 1000.
  // For full CSV export the caller stitches pages.
  ordersExport(period: ReportPeriodParams, page = 0, size = 100): Observable<OrderExportReport> {
    return this.http.get<OrderExportReport>(`${this.baseUrl}/orders`, {
      params: this.period(period).set('page', String(page)).set('size', String(size))
    });
  }

  private period(p: ReportPeriodParams): HttpParams {
    return new HttpParams().set('from', p.from).set('to', p.to);
  }
}
