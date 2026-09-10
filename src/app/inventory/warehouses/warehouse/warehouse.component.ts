import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesRestApi } from '../../../../lib/abtract/ViesRestApi';
import { RouteUtils } from '../../../../lib/util/Route.utils';
import { APP_ROUTES } from '../../../app.routes';
import { Address, AddressType } from '../../../shared/model/address.model';
import { InventoryLevel, Warehouse } from '../../../shared/model/inventory.model';
import { WarehouseService } from '../../../shared/service/warehouse/warehouse.service';
import { InventoryService } from '../../../shared/service/inventory/inventory.service';

// Warehouse editor at /inventory/warehouses/{new,:id}: the decorator form plus
// a nested address form (ship-from), and a read-only "stock held here" table.
@Component({
  selector: 'app-warehouse',
  templateUrl: './warehouse.component.html',
  styleUrls: ['./warehouse.component.scss'],
  imports: [NgComponentModule]
})
export class WarehouseComponent extends ViesRestApi<Warehouse, WarehouseService> implements OnInit {

  service = inject(WarehouseService);
  private inventoryService = inject(InventoryService);

  validForm = signal<boolean>(false);
  readonly blankAddress = new Address();
  levels = signal<InventoryLevel[]>([]);
  totalUnits = computed<number>(() => this.levels().reduce((s, l) => s + Number(l.quantity || 0), 0));

  override getRouteId() {
    const id = RouteUtils.getPathVariable('warehouses');
    return id === 'new' ? null : id;
  }

  override ngOnInit(): void {
    super.ngOnInit();
    const id = this.getRouteId();
    if (id) {
      this.inventoryService.levelsInWarehouse(id).subscribe({ next: res => this.levels.set(res ?? []), error: () => this.levels.set([]) });
    }
  }

  protected override afterSave(res: Warehouse, wasCreate: boolean): void {
    if (wasCreate && res.id) this.router.navigate([APP_ROUTES.inventoryWarehouse(res.id)]);
  }

  addressValue = computed<Address>(() => this.value()?.address ?? new Address());

  onMainFormChange(v: Warehouse) {
    const current = this.value();
    v.address = current?.address ?? new Address();
    this.value.set({ ...v });
  }

  onAddressChange(a: Address) {
    const v = this.value();
    if (!v) return;
    this.value.set({ ...v, address: { ...a, type: AddressType.SHIPPING } });
  }

  backToList() {
    this.router.navigate([APP_ROUTES.inventoryWarehouseList]);
  }

  override async remove() {
    if (!this.id()) return;
    const confirmed = await this.dialogUtils.openConfirmDialog(
      'Delete warehouse?',
      `Delete "${this.value()?.name}"? Its stock levels are removed with it (${this.totalUnits()} unit(s) on hand).`,
      'Delete', 'Cancel').catch(() => false);
    if (!confirmed) return;
    this.service.delete(this.id()).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: () => this.backToList(),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
}
