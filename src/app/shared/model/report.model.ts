import { Currency } from "../../../lib/model/currency.model";
import { ViesDateTime } from "../../../lib/model/vies.model";
import { FulfillmentStatus } from "./commerce.model";

// All report endpoints take an ISO-8601 `from` and `to` and return responses split
// by currency (multi-currency tenants can't sum dollars + euros). Auth note: these
// don't inherit the framework admin gate — production must gate at the reverse proxy.

export interface ReportPeriod {
    from: string;        // ISO-8601 instant string
    to: string;
}

export interface ReportPeriodParams {
    from: string;
    to: string;
}

// ---- Tax — § 8.6.1 ------------------------------------------------------
// Groups every captured order by (currency, country, state, city, postalCode)
// from the shipping address. `matchingRule` is resolved at report time against
// the current TaxRule registry — INFORMATIONAL ONLY (can drift from what was
// actually applied at sale time; that historical record lives in
// OrderFulfillment.metadata.tax.*).

export interface TaxReportMatchingRule {
    id: string;
    name: string;
    rate: string;
}

export interface TaxReportJurisdiction {
    country: string | null;
    state: string | null;
    city: string | null;
    postalCode: string | null;
    orderCount: number;
    grossSales: string;
    taxableAmount: string;
    taxCollected: string;
    taxRefunded: string;
    netTaxCollected: string;
    effectiveRate: string;
    matchingRule?: TaxReportMatchingRule;
}

export interface TaxReportCurrencyTotals {
    orderCount: number;
    grossSales: string;
    taxCollected: string;
    taxRefunded: string;
    netTaxCollected: string;
}

export interface TaxReportByCurrency {
    currency: Currency;
    jurisdictions: TaxReportJurisdiction[];
    totals: TaxReportCurrencyTotals;
}

export interface TaxReport {
    period: ReportPeriod;
    byCurrency: TaxReportByCurrency[];
}

// ---- Sales summary — § 8.6.2 -------------------------------------------

export interface SalesSummaryByCurrency {
    currency: Currency;
    orderCount: number;
    grossRevenue: string;
    discounts: string;
    tax: string;
    shipping: string;
    totalGross: string;
    averageOrderValue: string;
    refundCount: number;
    refundAmount: string;
}

export interface SalesSummaryReport {
    period: ReportPeriod;
    byCurrency: SalesSummaryByCurrency[];
}

// ---- Sales timeseries — § 8.6.3 ----------------------------------------

export type SalesTimeseriesBucket = 'day' | 'week' | 'month';

export interface SalesTimeseriesPoint {
    bucket: string;       // 'YYYY-MM-DD' for day, Monday-of-week for week, 'YYYY-MM' for month
    orderCount: number;
    revenue: string;
    tax: string;
}

export interface SalesTimeseriesByCurrency {
    currency: Currency;
    points: SalesTimeseriesPoint[];
}

export interface SalesTimeseriesReport {
    period: ReportPeriod;
    bucket: SalesTimeseriesBucket;
    byCurrency: SalesTimeseriesByCurrency[];
}

// ---- Top products — § 8.6.4 --------------------------------------------

export type TopOrderedBy = 'revenue' | 'quantity';

export interface TopProductEntry {
    productId: string;
    name: string;
    unitsSold: number;
    revenue: string;
}

export interface TopProductsByCurrency {
    currency: Currency;
    products: TopProductEntry[];
}

export interface TopProductsReport {
    period: ReportPeriod;
    orderedBy: TopOrderedBy;
    byCurrency: TopProductsByCurrency[];
}

// ---- Top categories — § 8.6.5 ------------------------------------------

export interface TopCategoryEntry {
    categoryId: string;
    name: string;
    unitsSold: number;
    revenue: string;
}

export interface TopCategoriesByCurrency {
    currency: Currency;
    categories: TopCategoryEntry[];
}

export interface TopCategoriesReport {
    period: ReportPeriod;
    orderedBy: TopOrderedBy;
    byCurrency: TopCategoriesByCurrency[];
}

// ---- Geography — § 8.6.6 -----------------------------------------------

export type GeographyGroupBy = 'country' | 'state' | 'city';

export interface GeographyEntry {
    country: string | null;
    state: string | null;
    city: string | null;
    orderCount: number;
    revenue: string;
}

export interface GeographyByCurrency {
    currency: Currency;
    locations: GeographyEntry[];
}

export interface GeographyReport {
    period: ReportPeriod;
    groupBy: GeographyGroupBy;
    byCurrency: GeographyByCurrency[];
}

// ---- Order status — § 8.6.7 --------------------------------------------

export interface OrderStatusReport {
    period: ReportPeriod;
    totalOrders: number;
    counts: Partial<Record<FulfillmentStatus, number>>;
}

// ---- Refunds — § 8.6.8 -------------------------------------------------

export interface RefundsByCurrency {
    currency: Currency;
    totalOrders: number;
    refundCount: number;
    totalRefunded: string;
    refundRate: string;   // 4-decimal, e.g. "0.0448"
}

export interface RefundsReport {
    period: ReportPeriod;
    byCurrency: RefundsByCurrency[];
}

// ---- Customers — § 8.6.9 -----------------------------------------------

export interface CustomerEntry {
    userId: string;
    orderCount: number;
    revenue: string;
}

export interface CustomersByCurrency {
    currency: Currency;
    topByRevenue: CustomerEntry[];
}

export interface CustomersReport {
    period: ReportPeriod;
    totalCustomers: number;
    byCurrency: CustomersByCurrency[];
}

// ---- Raw export — § 8.6.10 ---------------------------------------------
// Denormalized one-row-per-order export for Excel / Metabase / Looker.
// Paginated; size defaults to 100, capped at 1000.

export interface OrderExportRow {
    orderFulfillmentId: string;
    checkoutOrderId: string;
    orderNumber: string;
    createdAt: ViesDateTime;
    userId: string;
    currency: Currency;
    subtotal: string;
    discountAmount: string;
    tax: string;
    shippingCost: string;
    totalAmount: string;
    status: FulfillmentStatus;
    shippingCountry: string | null;
    shippingState: string | null;
    shippingCity: string | null;
    shippingPostalCode: string | null;
    itemCount: number;
}

export interface OrderExportReport {
    period: ReportPeriod;
    page: number;
    size: number;
    totalElements: number;
    rows: OrderExportRow[];
}
