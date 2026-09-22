import { HistoryPanelComponent } from '../../../shared/component/history-panel/history-panel.component';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesRestApi } from '../../../../lib/abtract/ViesRestApi';
import { RouteUtils } from '../../../../lib/util/Route.utils';
import { APP_ROUTES } from '../../../app.routes';
import { Address, AddressType } from '../../../shared/model/address.model';
import { PurchaseOrder, Supplier } from '../../../shared/model/inventory.model';
import { SupplierService } from '../../../shared/service/supplier/supplier.service';
import { PurchaseOrderService } from '../../../shared/service/purchase-order/purchase-order.service';

// Supplier editor at /inventory/suppliers/{new,:id}: decorator form + address + open POs.
@Component({
  selector: 'app-supplier',
  templateUrl: './supplier.component.html',
  styleUrls: ['./supplier.component.scss'],
  imports: [NgComponentModule, HistoryPanelComponent]
})
export class SupplierComponent extends ViesRestApi<Supplier, SupplierService> implements OnInit {

  service = inject(SupplierService);
  private purchaseOrders = inject(PurchaseOrderService);

  validForm = signal<boolean>(false);
  readonly blankAddress = new Address();
  openOrders = signal<PurchaseOrder[]>([]);

  override getRouteId() {
    const id = RouteUtils.getPathVariable('suppliers');
    return id === 'new' ? null : id;
  }

  override ngOnInit(): void {
    super.ngOnInit();
    const id = this.getRouteId();
    if (id) this.purchaseOrders.open(id).subscribe({ next: res => this.openOrders.set(res ?? []), error: () => this.openOrders.set([]) });
  }

  protected override afterSave(res: Supplier, wasCreate: boolean): void {
    if (wasCreate && res.id) this.router.navigate([APP_ROUTES.inventorySupplier(res.id)]);
  }

  addressValue = computed<Address>(() => this.value()?.address ?? new Address());

  onMainFormChange(v: Supplier) {
    const current = this.value();
    v.address = current?.address ?? new Address();
    this.value.set({ ...v });
  }

  onAddressChange(a: Address) {
    const v = this.value();
    if (!v) return;
    this.value.set({ ...v, address: { ...a, type: AddressType.SHIPPING } });
  }

  backToList() { this.router.navigate([APP_ROUTES.inventorySupplierList]); }
  openOrder(po: PurchaseOrder) { if (po.id) this.router.navigate([APP_ROUTES.inventoryPurchaseOrder(po.id)]); }
  newOrder() { this.router.navigate([APP_ROUTES.inventoryPurchaseOrderNew], { queryParams: { supplierId: this.id() } }); }

  override async remove() {
    if (!this.id()) return;
    const confirmed = await this.dialogUtils.openConfirmDialog('Delete supplier?', `Delete "${this.value()?.name}"? Refused if purchase orders reference it — mark it inactive instead.`, 'Delete', 'Cancel').catch(() => false);
    if (!confirmed) return;
    this.service.delete(this.id()).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: () => this.backToList(),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
}
