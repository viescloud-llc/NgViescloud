import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { APP_ROUTES } from '../../../app.routes';
import { Warehouse } from '../../../shared/model/inventory.model';
import { WarehouseService } from '../../../shared/service/warehouse/warehouse.service';

// Warehouses at /inventory/warehouses/list.
@Component({
  selector: 'app-warehouse-list',
  templateUrl: './warehouse-list.component.html',
  styleUrls: ['./warehouse-list.component.scss'],
  imports: [NgComponentModule]
})
export class WarehouseListComponent extends ViesMatFormFieldMap implements OnInit {

  protected readonly rxjsUtils = inject(RxJSUtils);
  protected readonly dialogUtils = inject(DialogUtils);
  protected readonly warehouseService = inject(WarehouseService);
  protected readonly router = inject(Router);

  warehouses = signal<Warehouse[]>([]);
  blank = new Warehouse();

  ngOnInit(): void {
    this.refresh();
  }

  refresh() {
    this.warehouseService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => this.warehouses.set([...(res ?? [])].sort((a, b) => Number(b.defaultWarehouse) - Number(a.defaultWarehouse) || (b.priority ?? 0) - (a.priority ?? 0))),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  add() {
    this.router.navigate([APP_ROUTES.inventoryWarehouseNew]);
  }

  select(w: Warehouse) {
    if (!w.id) return;
    this.router.navigate([APP_ROUTES.inventoryWarehouse(w.id)]);
  }
}
