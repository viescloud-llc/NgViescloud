import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { APP_ROUTES } from '../../../app.routes';
import { Supplier } from '../../../shared/model/inventory.model';
import { SupplierService } from '../../../shared/service/supplier/supplier.service';

// Suppliers at /inventory/suppliers/list.
@Component({
  selector: 'app-supplier-list',
  templateUrl: './supplier-list.component.html',
  styleUrls: ['./supplier-list.component.scss'],
  imports: [NgComponentModule]
})
export class SupplierListComponent extends ViesMatFormFieldMap implements OnInit {
  protected readonly rxjsUtils = inject(RxJSUtils);
  protected readonly dialogUtils = inject(DialogUtils);
  protected readonly supplierService = inject(SupplierService);
  protected readonly router = inject(Router);

  suppliers = signal<Supplier[]>([]);
  blank = new Supplier();

  ngOnInit(): void { this.refresh(); }

  refresh() {
    this.supplierService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => this.suppliers.set([...(res ?? [])].sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name))),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
  add() { this.router.navigate([APP_ROUTES.inventorySupplierNew]); }
  select(s: Supplier) { if (s.id) this.router.navigate([APP_ROUTES.inventorySupplier(s.id)]); }
}
