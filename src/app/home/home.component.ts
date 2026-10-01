import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgComponentModule } from '../../lib/module/ng-component.module';
import { ViesService } from '../../lib/service/rest.service';
import { AuthenticatorService } from '../../lib/service/authenticator.service';
import { RxJSUtils } from '../../lib/util/RxJS.utils';
import { APP_ROUTES } from '../app.routes';
import { DashboardReport } from '../shared/model/report.model';
import { ReportsService } from '../shared/service/reports/reports.service';
import { StoreSettingsService } from '../shared/service/store-settings/store-settings.service';

interface Tile { label: string; value: string | number; hint?: string; link?: string; query?: Record<string, string>; warn?: boolean; }

// Manager home: the operational dashboard (checklist-2 §10). Each tile links to
// the filtered list it summarises. Staff without reports:read see the welcome only.
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [NgComponentModule]
})
export class HomeComponent implements OnInit {
  private readonly reports = inject(ReportsService);
  private readonly authenticatorService = inject(AuthenticatorService);
  private readonly rxjsUtils = inject(RxJSUtils);
  private readonly router = inject(Router);
  readonly storeSettings = inject(StoreSettingsService);

  data = signal<DashboardReport | null>(null);
  error = signal<string>('');
  canSee = computed<boolean>(() => this.authenticatorService.isAuthenticatedSync() && this.authenticatorService.hasAuthorityOrAdmin('reports:read'));
  // Signed in, but the role has no reports:read — a different message than "sign in" (FE-18).
  signedInWithoutDashboard = computed<boolean>(() => this.authenticatorService.isAuthenticatedSync() && !this.authenticatorService.hasAuthorityOrAdmin('reports:read'));
  storeName = computed<string>(() => this.storeSettings.current()?.storeName ?? this.storeSettings.publicInfo()?.storeName ?? 'Venzora');

  tiles = computed<Tile[]>(() => {
    const d = this.data(); if (!d) return [];
    const rev = Object.entries(d.revenueTodayByCurrency ?? {}).map(([c, v]) => `${Number(v).toFixed(2)} ${c}`).join(' · ');
    const tiles: Tile[] = [
      { label: "Today's orders", value: d.ordersToday, hint: rev || 'no revenue yet', link: APP_ROUTES.commerceOrderList, query: { from: this.today() } },
      { label: 'Awaiting shipment', value: d.awaitingShipment, hint: `${d.shippedInTransit} in transit`, link: APP_ROUTES.commerceOrderList, query: { status: 'PROCESSING' }, warn: d.awaitingShipment > 0 },
      { label: 'Pending returns', value: d.pendingReturns, hint: 'requested / received / inspecting', link: APP_ROUTES.commerceReturnList, query: { status: 'REQUESTED' }, warn: d.pendingReturns > 0 },
      { label: 'Low stock', value: d.lowStockVariants, hint: `${d.outOfStockVariants} out of stock`, link: APP_ROUTES.inventoryLowStock, warn: d.outOfStockVariants > 0 },
      { label: 'Unpaid > 1 h', value: d.unpaidPendingOlderThanHour, hint: 'PENDING orders without payment', link: APP_ROUTES.commerceOrderList, query: { status: 'PENDING' }, warn: d.unpaidPendingOlderThanHour > 0 },
      { label: 'Open purchase orders', value: d.openPurchaseOrders, hint: 'placed, not fully received', link: APP_ROUTES.inventoryPurchaseOrderList },
      { label: 'Draft products', value: d.draftProducts, hint: 'not visible in the shop', link: APP_ROUTES.catalogProductList, query: { status: 'DRAFT' } }
    ];
    return tiles;
  });

  ngOnInit(): void {
    if (ViesService.isNotCSR()) return;
    // The component can be (re)created before the auth state has settled after
    // login/hydration, so don't gate on canSee() here — fetch, and retry a
    // couple of times when the backend says 401/403 while the token arrives.
    // An anonymous visitor (no session at all) is not "hydrating": skip the
    // call instead of producing 401s (FE-17).
    if (!this.authenticatorService.isAuthenticatedSync() && !this.authenticatorService.hasSessionRefreshToken()) return;
    this.refresh(3);
  }
  refresh(retries = 0) {
    // A settled session without reports:read never gets the dashboard — don't ask for it (FE-18).
    if (this.authenticatorService.isAuthenticatedSync() && !this.authenticatorService.hasAuthorityOrAdmin('reports:read')) return;
    this.reports.dashboard().subscribe({
      next: d => { this.data.set(d); this.error.set(''); },
      error: err => {
        const status = Number(err?.status ?? 0);
        if ((status === 401 || status === 403) && retries > 0) { setTimeout(() => this.refresh(retries - 1), 1200); return; }
        if (status === 401 || status === 403) return; // not staff: the template shows the welcome only
        this.error.set(err?.error?.reason || err?.message || 'Could not load the dashboard');
      }
    });
  }
  open(t: Tile) { if (t.link) this.router.navigate([t.link], { queryParams: t.query }); }
  private today(): string { return new Date().toISOString().slice(0, 10); }
}
