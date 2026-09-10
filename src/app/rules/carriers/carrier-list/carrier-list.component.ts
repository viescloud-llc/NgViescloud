import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { APP_ROUTES } from '../../../app.routes';
import { Carrier } from '../../../shared/model/shipping.model';
import { CarrierService } from '../../../shared/service/carrier/carrier.service';

// Carriers at /rules/carriers/list.
@Component({
  selector: 'app-carrier-list',
  templateUrl: './carrier-list.component.html',
  styleUrls: ['./carrier-list.component.scss'],
  imports: [NgComponentModule]
})
export class CarrierListComponent extends ViesMatFormFieldMap implements OnInit {

  protected readonly rxjsUtils = inject(RxJSUtils);
  protected readonly dialogUtils = inject(DialogUtils);
  protected readonly carrierService = inject(CarrierService);
  protected readonly router = inject(Router);

  carriers = signal<Carrier[]>([]);
  blank = new Carrier();

  ngOnInit(): void {
    this.refresh();
  }

  refresh() {
    this.carrierService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => this.carriers.set([...(res ?? [])].sort((a, b) => a.name.localeCompare(b.name))),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  add() {
    this.router.navigate([APP_ROUTES.rulesCarrierNew]);
  }

  select(c: Carrier) {
    if (!c.id) return;
    this.router.navigate([APP_ROUTES.rulesCarrier(c.id)]);
  }
}
