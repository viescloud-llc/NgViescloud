import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { RxJSUtils } from '../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../lib/util/Dialog.utils';
import { DigitalDownloadView, FulfillmentStatus, OrderFulfillment, Shipment } from '../../shared/model/commerce.model';
import { DigitalDownloadService } from '../../shared/service/digital-download/digital-download.service';
import { VariantFulfillmentType } from '../../shared/model/product.model';
import { FileUtils } from '../../../lib/util/File.utils';
import { OrderFulfillmentService } from '../../shared/service/order-fulfillment/order-fulfillment.service';
import { ShipmentService } from '../../shared/service/shipment/shipment.service';
import { CheckoutOrchestratorService } from '../../shared/service/checkout-orchestrator/checkout-orchestrator.service';
import { CheckoutOrderService, CheckoutOrderView } from '../../shared/service/checkout-order/checkout-order.service';
import { APP_ROUTES } from '../../app.routes';

// Test-shop order status page: fulfillment status, line items, totals,
// shipping address, shipment tracking, and payment status.
//
// Shipments: no by-order endpoint exists, so we getAll() and filter
// client-side by orderFulfillment.id. (The shipments controller is
// admin-gated — fine for this sim, where the tester is an admin anyway;
// non-admin users just see the section fail soft as "no shipments".)
//
// A PENDING order shows a "Complete payment" button — the same
// POST /orders/{id}/complete used at checkout, for the case where the buyer
// approved on PayPal but navigated back without completing.
@Component({
  selector: 'app-shop-order',
  templateUrl: './shop-order.component.html',
  styleUrls: ['./shop-order.component.scss'],
  imports: [MatButtonModule]
})
export class ShopOrderComponent implements OnInit {

  private rxjsUtils = inject(RxJSUtils);
  private dialogUtils = inject(DialogUtils);
  private orderService = inject(OrderFulfillmentService);
  private shipmentService = inject(ShipmentService);
  private checkoutOrchestrator = inject(CheckoutOrchestratorService);
  private checkoutOrderService = inject(CheckoutOrderService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  private digitalDownloadService = inject(DigitalDownloadService);

  order = signal<OrderFulfillment | null>(null);
  shipments = signal<Shipment[]>([]);
  downloads = signal<DigitalDownloadView[]>([]);
  downloading = signal<string>('');

  hasDigitalItems = computed<boolean>(() =>
    (this.order()?.items ?? []).some(i => i.productVariant?.fulfillmentType === VariantFulfillmentType.DIGITAL)
  );
  isDigitalOnly = computed<boolean>(() => {
    const items = this.order()?.items ?? [];
    return items.length > 0 && items.every(i => i.productVariant?.fulfillmentType === VariantFulfillmentType.DIGITAL);
  });
  payment = signal<CheckoutOrderView | null>(null);
  completing = signal<boolean>(false);

  canCompletePayment = computed<boolean>(() =>
    this.order()?.status === FulfillmentStatus.PENDING
  );

  addressLine = computed<string>(() => {
    const a = this.order()?.shippingAddress;
    if (!a) return '—';
    return [a.street, a.suite, a.city, a.state, a.postalCode, a.country]
      .filter(Boolean).join(', ');
  });

  ngOnInit(): void {
    const id = this.activatedRoute.snapshot.paramMap.get('orderId');
    if (!id) return;

    this.orderService.get(id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: o => {
        this.order.set(o);
        this.loadShipments(o);
        this.loadPayment(o);
        this.loadDownloads(o);
      },
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  private loadShipments(order: OrderFulfillment) {
    // Fail soft — shipments are a bonus panel, not the point of the page.
    this.shipmentService.getAll().subscribe({
      next: all => this.shipments.set(all.filter(s => s.orderFulfillment?.id === order.id)),
      error: () => this.shipments.set([])
    });
  }

  // Download rights appear once payment is captured; the server tells us why a
  // row is unavailable (pending payment, refunded, revoked, capped).
  private loadDownloads(order: OrderFulfillment) {
    if (!order.id) return;
    this.digitalDownloadService.list(order.id).subscribe({
      next: res => this.downloads.set(res ?? []),
      error: () => this.downloads.set([])
    });
  }

  downloadFile(d: DigitalDownloadView, assetId: string, fileName: string) {
    const order = this.order();
    if (!order?.id || this.downloading()) return;
    this.downloading.set(assetId);
    this.digitalDownloadService.download(order.id, d.entitlementId, assetId).subscribe({
      next: blob => {
        this.downloading.set('');
        FileUtils.saveBlobAsFile(fileName || 'download', blob);
        this.loadDownloads(order); // refresh the counter
      },
      error: err => { this.downloading.set(''); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  formatBytes(size?: number | null): string {
    const n = Number(size ?? 0);
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  private loadPayment(order: OrderFulfillment) {
    if (!order.checkoutOrderId) return;
    this.checkoutOrderService.get(order.checkoutOrderId).subscribe({
      next: p => this.payment.set(p),
      error: () => this.payment.set(null)
    });
  }

  deliveryEta(s: Shipment): string {
    const d = s.estimatedDeliveryDate;
    if (!d?.year) return '—';
    return `${d.month}/${d.day}/${d.year}`;
  }

  async completePayment() {
    const order = this.order();
    if (!order?.id) return;
    this.completing.set(true);
    try {
      const updated = await firstValueFrom(
        this.checkoutOrchestrator.complete(order.id).pipe(this.rxjsUtils.waitLoadingDialog())
      );
      this.order.set(updated);
      this.loadPayment(updated);
      this.loadDownloads(updated);
    } catch (err) {
      this.dialogUtils.openErrorMessageFromError(err);
    } finally {
      this.completing.set(false);
    }
  }

  backToOrders() {
    this.router.navigate([APP_ROUTES.shopOrders]);
  }
}
