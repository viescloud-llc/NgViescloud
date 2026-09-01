import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { MatOption } from '../../../../lib/model/mat.model';
import { APP_ROUTES } from '../../../app.routes';
import { Shipment, ShipmentStatus } from '../../../shared/model/commerce.model';
import { ShipmentService } from '../../../shared/service/shipment/shipment.service';

// Active-shipments queue at /commerce/shipments/list. Client-side filters:
// ShipmentStatus selector + free-text search on trackingNumber/carrier.
@Component({
  selector: 'app-shipment-list',
  templateUrl: './shipment-list.component.html',
  styleUrls: ['./shipment-list.component.scss'],
  imports: [NgComponentModule]
})
export class ShipmentListComponent extends ViesMatFormFieldMap implements OnInit {

  protected readonly rxjsUtils = inject(RxJSUtils);
  protected readonly dialogUtils = inject(DialogUtils);
  protected readonly shipmentService = inject(ShipmentService);
  protected readonly router = inject(Router);

  shipments = signal<Shipment[]>([]);
  blankShipment = new Shipment();

  searchTerm = signal<string>('');
  statusFilter = signal<ShipmentStatus | null>(null);

  statusOptions: MatOption<ShipmentStatus | null>[] = [
    { value: null, valueLabel: 'All statuses' },
    ...Object.values(ShipmentStatus).map(s => ({
      value: s as ShipmentStatus | null,
      valueLabel: s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ')
    }))
  ];

  filteredShipments = computed<Shipment[]>(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();
    return this.shipments().filter(s => {
      if (status && s.status !== status) return false;
      if (!term) return true;
      return (s.trackingNumber || '').toLowerCase().includes(term)
          || (s.carrier || '').toLowerCase().includes(term);
    });
  });

  ngOnInit(): void {
    this.refresh();
  }

  refresh() {
    this.shipmentService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => this.shipments.set(res),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  addShipment() {
    this.router.navigate([APP_ROUTES.commerceShipmentNew]);
  }

  selectShipment(shipment: Shipment) {
    if (!shipment.id) return;
    this.router.navigate([APP_ROUTES.commerceShipment(shipment.id)]);
  }
}
