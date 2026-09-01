import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { RxJSUtils } from '../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../lib/util/Dialog.utils';
import { OrderFulfillment } from '../../shared/model/commerce.model';
import { OrderFulfillmentService } from '../../shared/service/order-fulfillment/order-fulfillment.service';
import { APP_ROUTES } from '../../app.routes';

// Test-shop "my orders" — the /orders controller is user-scoped, so getAll()
// returns only the caller's own orders. Newest first; click a row for status
// detail. Also the PayPal returnUrl destination after approving.
@Component({
  selector: 'app-shop-order-list',
  templateUrl: './shop-order-list.component.html',
  styleUrls: ['./shop-order-list.component.scss'],
  imports: [MatButtonModule]
})
export class ShopOrderListComponent implements OnInit {

  private rxjsUtils = inject(RxJSUtils);
  private dialogUtils = inject(DialogUtils);
  private orderService = inject(OrderFulfillmentService);
  private router = inject(Router);

  orders = signal<OrderFulfillment[]>([]);

  ngOnInit(): void {
    this.orderService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => this.orders.set(
        // Newest first — UUIDv7 ids are time-ordered, so a plain id sort works.
        [...res].sort((a, b) => (b.id || '').localeCompare(a.id || ''))
      ),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  createdDate(o: OrderFulfillment): string {
    const c = o.createdAt;
    if (!c?.year) return '—';
    return `${c.month}/${c.day}/${c.year}`;
  }

  view(o: OrderFulfillment) {
    if (o.id) this.router.navigate([APP_ROUTES.shopOrder(o.id)]);
  }

  shop() {
    this.router.navigate([APP_ROUTES.shopProducts]);
  }
}
