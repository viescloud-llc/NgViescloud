import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { NgComponentModule } from '../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../lib/util/RxJS.utils';
import { DialogUtils } from '../../lib/util/Dialog.utils';
import { ViesDateTime } from '../../lib/model/vies.model';
import { ReportsService } from '../shared/service/reports/reports.service';
import {
  CustomersReport,
  GeographyReport,
  OrderExportRow,
  OrderStatusReport,
  RefundsReport,
  ReportPeriodParams,
  SalesSummaryReport,
  SalesTimeseriesBucket,
  SalesTimeseriesReport,
  TaxReport,
  TaxReportJurisdiction,
  TopCategoriesReport,
  TopProductsReport
} from '../shared/model/report.model';

// Reports & analytics at /reports (intent § 5.10). One period drives every
// report; "Run reports" fans out to all nine endpoints in parallel and each
// section renders as its data lands. Highest-value piece is the tax filing
// table (grouped by jurisdiction, CSV download); the sales dashboard, order
// pipeline, refunds, and customer cards round it out. Raw order export
// stitches the paginated endpoint into one CSV.
//
// Charts are intentionally deferred — every visualization renders as a dense
// table for now (correct numbers first; pretty lines later).
@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  imports: [NgComponentModule]
})
export class ReportsComponent extends ViesMatFormFieldMap implements OnInit {

  protected readonly rxjsUtils = inject(RxJSUtils);
  protected readonly dialogUtils = inject(DialogUtils);
  protected readonly reportsService = inject(ReportsService);

  // ---- Period ----------------------------------------------------------------
  //
  // Two ViesDateTime pickers + preset buttons. Reports take ISO-8601 instants;
  // `from` is the start-of-day, `to` end-of-day so a single-day range works.
  fromDate = signal<ViesDateTime>(ViesDateTime.fromJsDate(new Date(Date.now() - 30 * 24 * 3600 * 1000)));
  toDate = signal<ViesDateTime>(ViesDateTime.now());

  private periodParams(): ReportPeriodParams {
    const from = ViesDateTime.toJsDate(this.fromDate());
    from.setHours(0, 0, 0, 0);
    const to = ViesDateTime.toJsDate(this.toDate());
    to.setHours(23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString() };
  }

  setPresetDays(days: number) {
    this.fromDate.set(ViesDateTime.fromJsDate(new Date(Date.now() - days * 24 * 3600 * 1000)));
    this.toDate.set(ViesDateTime.now());
  }

  setPresetThisMonth() {
    const now = new Date();
    this.fromDate.set(ViesDateTime.fromJsDate(new Date(now.getFullYear(), now.getMonth(), 1)));
    this.toDate.set(ViesDateTime.now());
  }

  setPresetThisYear() {
    const now = new Date();
    this.fromDate.set(ViesDateTime.fromJsDate(new Date(now.getFullYear(), 0, 1)));
    this.toDate.set(ViesDateTime.now());
  }

  onFromChange(dt: ViesDateTime) { this.fromDate.set(structuredClone(dt)); }
  onToChange(dt: ViesDateTime) { this.toDate.set(structuredClone(dt)); }

  // ---- Report state ------------------------------------------------------------

  loadState = signal<'idle' | 'loading' | 'loaded' | 'failed'>('idle');

  taxReport = signal<TaxReport | null>(null);
  salesSummary = signal<SalesSummaryReport | null>(null);
  salesTimeseries = signal<SalesTimeseriesReport | null>(null);
  topProducts = signal<TopProductsReport | null>(null);
  topCategories = signal<TopCategoriesReport | null>(null);
  geography = signal<GeographyReport | null>(null);
  orderStatus = signal<OrderStatusReport | null>(null);
  refunds = signal<RefundsReport | null>(null);
  customers = signal<CustomersReport | null>(null);

  timeseriesBucket = signal<SalesTimeseriesBucket>('day');

  // Order-status table rows out of the counts record.
  orderStatusRows = computed<{ status: string; count: number; percent: string }[]>(() => {
    const report = this.orderStatus();
    if (!report) return [];
    const total = report.totalOrders || 1;
    return Object.entries(report.counts ?? {})
      .map(([status, count]) => ({
        status,
        count: count as number,
        percent: ((count as number) / total * 100).toFixed(1) + '%'
      }))
      .sort((a, b) => b.count - a.count);
  });

  async runReports() {
    const period = this.periodParams();
    this.loadState.set('loading');
    try {
      // Fan out all nine in parallel — each section renders from its own
      // signal, and a single failing endpoint fails the batch loudly instead
      // of silently showing stale numbers.
      const [tax, summary, timeseries, products, categories, geo, status, refunds, customers] = await Promise.all([
        firstValueFrom(this.reportsService.tax(period)),
        firstValueFrom(this.reportsService.salesSummary(period)),
        firstValueFrom(this.reportsService.salesTimeseries(period, this.timeseriesBucket())),
        firstValueFrom(this.reportsService.topProducts(period)),
        firstValueFrom(this.reportsService.topCategories(period)),
        firstValueFrom(this.reportsService.geography(period)),
        firstValueFrom(this.reportsService.orderStatus(period)),
        firstValueFrom(this.reportsService.refunds(period)),
        firstValueFrom(this.reportsService.customers(period))
      ]);
      this.taxReport.set(tax);
      this.salesSummary.set(summary);
      this.salesTimeseries.set(timeseries);
      this.topProducts.set(products);
      this.topCategories.set(categories);
      this.geography.set(geo);
      this.orderStatus.set(status);
      this.refunds.set(refunds);
      this.customers.set(customers);
      this.loadState.set('loaded');
    } catch (err) {
      this.loadState.set('failed');
      this.dialogUtils.openErrorMessageFromError(err);
    }
  }

  ngOnInit(): void {
    // Don't auto-run — the fan-out is nine requests; let the admin pick the
    // period first.
  }

  jurisdictionLabel(j: TaxReportJurisdiction): string {
    const parts = [j.country, j.state, j.city, j.postalCode].filter(Boolean);
    return parts.length ? parts.join(' / ') : '(everywhere)';
  }

  // ---- CSV downloads -----------------------------------------------------------

  private downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
    const escape = (cell: string | number) => {
      const s = String(cell ?? '');
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const text = [header, ...rows].map(r => r.map(escape).join(',')).join('\n');
    const blob = new Blob([text], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  downloadTaxCsv() {
    const report = this.taxReport();
    if (!report) return;
    const rows: (string | number)[][] = [];
    for (const cur of report.byCurrency) {
      for (const j of cur.jurisdictions) {
        rows.push([
          cur.currency, j.country ?? '', j.state ?? '', j.city ?? '', j.postalCode ?? '',
          j.orderCount, j.grossSales, j.taxableAmount, j.taxCollected, j.taxRefunded,
          j.netTaxCollected, j.effectiveRate, j.matchingRule?.name ?? ''
        ]);
      }
    }
    this.downloadCsv(
      'tax-report.csv',
      ['currency', 'country', 'state', 'city', 'postalCode', 'orders', 'grossSales',
       'taxableAmount', 'taxCollected', 'taxRefunded', 'netTaxCollected', 'effectiveRate', 'matchingRule'],
      rows
    );
  }

  // Raw order export — stitch every page of /reports/orders into one CSV.
  exportingOrders = signal<boolean>(false);

  async downloadOrdersCsv() {
    const period = this.periodParams();
    this.exportingOrders.set(true);
    try {
      const all: OrderExportRow[] = [];
      let page = 0;
      const size = 1000; // server cap
      for (;;) {
        const chunk = await firstValueFrom(this.reportsService.ordersExport(period, page, size));
        all.push(...(chunk.rows ?? []));
        const fetched = (page + 1) * size;
        if (!chunk.rows?.length || fetched >= chunk.totalElements) break;
        page++;
      }
      this.downloadCsv(
        'orders-export.csv',
        ['orderNumber', 'createdAt', 'userId', 'currency', 'subtotal', 'discountAmount',
         'tax', 'shippingCost', 'totalAmount', 'status', 'shippingCountry', 'shippingState',
         'shippingCity', 'shippingPostalCode', 'itemCount', 'orderFulfillmentId', 'checkoutOrderId'],
        all.map(r => [
          r.orderNumber,
          r.createdAt ? `${r.createdAt.year}-${String(r.createdAt.month).padStart(2, '0')}-${String(r.createdAt.day).padStart(2, '0')}` : '',
          r.userId, r.currency, r.subtotal, r.discountAmount, r.tax, r.shippingCost,
          r.totalAmount, r.status, r.shippingCountry ?? '', r.shippingState ?? '',
          r.shippingCity ?? '', r.shippingPostalCode ?? '', r.itemCount,
          r.orderFulfillmentId, r.checkoutOrderId
        ])
      );
    } catch (err) {
      this.dialogUtils.openErrorMessageFromError(err);
    } finally {
      this.exportingOrders.set(false);
    }
  }
}
