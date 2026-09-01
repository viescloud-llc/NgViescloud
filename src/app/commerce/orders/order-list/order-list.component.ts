import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { MatOption } from '../../../../lib/model/mat.model';
import { APP_ROUTES } from '../../../app.routes';
import { OrderFulfillment, FulfillmentStatus } from '../../../shared/model/commerce.model';
import { OrderFulfillmentService } from '../../../shared/service/order-fulfillment/order-fulfillment.service';

// Order queue at /commerce/orders/list. Read-only landing — orders come from
// checkout (nothing to "create" here), so no Add button. Click a row to open
// the detail editor (status transitions, notes, address view, metadata viewer).
//
// Filtering is client-side for now: FulfillmentStatus selector + free-text
// search across orderNumber. If the list grows past a few hundred rows, switch
// to POST /matches with server-side pagination — matches intent § 5.4.
@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss'],
  imports: [NgComponentModule]
})
export class OrderListComponent extends ViesMatFormFieldMap implements OnInit {

  protected readonly rxjsUtils = inject(RxJSUtils);
  protected readonly dialogUtils = inject(DialogUtils);
  protected readonly orderService = inject(OrderFulfillmentService);
  protected readonly router = inject(Router);

  orders = signal<OrderFulfillment[]>([]);
  blankOrder = new OrderFulfillment();

  searchTerm = signal<string>('');
  statusFilter = signal<FulfillmentStatus | null>(null);

  statusOptions: MatOption<FulfillmentStatus | null>[] = [
    { value: null,                                   valueLabel: 'All statuses' },
    { value: FulfillmentStatus.PENDING,              valueLabel: 'Pending' },
    { value: FulfillmentStatus.PROCESSING,           valueLabel: 'Processing' },
    { value: FulfillmentStatus.SHIPPED,              valueLabel: 'Shipped' },
    { value: FulfillmentStatus.DELIVERED,            valueLabel: 'Delivered' },
    { value: FulfillmentStatus.CANCELLED,            valueLabel: 'Cancelled' },
    { value: FulfillmentStatus.RETURNED,             valueLabel: 'Returned' },
    { value: FulfillmentStatus.REFUNDED,             valueLabel: 'Refunded' },
    { value: FulfillmentStatus.PARTIALLY_REFUNDED,   valueLabel: 'Partially Refunded' },
    { value: FulfillmentStatus.FAILED,               valueLabel: 'Failed' }
  ];

  filteredOrders = computed<OrderFulfillment[]>(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();
    return this.orders().filter(o => {
      if (status && o.status !== status) return false;
      if (!term) return true;
      return (o.orderNumber || '').toLowerCase().includes(term);
    });
  });

  ngOnInit(): void {
    this.refresh();
  }

  refresh() {
    this.orderService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => this.orders.set(res),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  selectOrder(order: OrderFulfillment) {
    if (!order.id) return;
    this.router.navigate([APP_ROUTES.commerceOrder(order.id)]);
  }
}
