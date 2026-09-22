import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { APP_ROUTES } from '../../../app.routes';
import { PurchaseOrder, PurchaseOrderStatus } from '../../../shared/model/inventory.model';
import { PurchaseOrderService } from '../../../shared/service/purchase-order/purchase-order.service';

// Purchase orders at /inventory/purchase-orders/list (newest first; status filter).
@Component({
  selector: 'app-purchase-order-list',
  templateUrl: './purchase-order-list.component.html',
  styleUrls: ['./purchase-order-list.component.scss'],
  imports: [NgComponentModule, MatFormFieldModule, MatSelectModule]
})
export class PurchaseOrderListComponent extends ViesMatFormFieldMap implements OnInit {
  private readonly rxjsUtils = inject(RxJSUtils);
  private readonly dialogUtils = inject(DialogUtils);
  private readonly purchaseOrders = inject(PurchaseOrderService);
  private readonly router = inject(Router);

  all = signal<PurchaseOrder[]>([]);
  statusFilter = signal<PurchaseOrderStatus | 'OPEN' | ''>('OPEN');
  readonly statuses: PurchaseOrderStatus[] = ['DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'];
  rows = computed<PurchaseOrder[]>(() => {
    const f = this.statusFilter();
    return this.all().filter(p => !f || (f === 'OPEN' ? ['DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED'].includes(p.status ?? '') : p.status === f));
  });

  ngOnInit(): void { this.refresh(); }

  refresh() {
    this.purchaseOrders.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => this.all.set([...(res ?? [])].sort((a, b) => (b.id ?? '').localeCompare(a.id ?? ''))),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
  add() { this.router.navigate([APP_ROUTES.inventoryPurchaseOrderNew]); }
  open(po: PurchaseOrder) { if (po.id) this.router.navigate([APP_ROUTES.inventoryPurchaseOrder(po.id)]); }
  supplierName(po: PurchaseOrder): string { return (po.supplier as { name?: string } | null)?.name ?? ''; }
  warehouseName(po: PurchaseOrder): string { return (po.warehouse as { name?: string } | null)?.name ?? ''; }
  money(v: unknown): string { return Number(v ?? 0).toFixed(2); }
}
