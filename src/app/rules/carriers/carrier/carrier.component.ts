import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesRestApi } from '../../../../lib/abtract/ViesRestApi';
import { RouteUtils } from '../../../../lib/util/Route.utils';
import { APP_ROUTES } from '../../../app.routes';
import { Carrier, CarrierServiceLevel } from '../../../shared/model/shipping.model';
import { CarrierService } from '../../../shared/service/carrier/carrier.service';

// Carrier editor at /rules/carriers/{new,:id}: decorator form + credential
// inputs (show/hide) + a service-level table. Credentials round-trip as
// entered, like SMTP providers.
@Component({
  selector: 'app-carrier',
  templateUrl: './carrier.component.html',
  styleUrls: ['./carrier.component.scss'],
  imports: [NgComponentModule, FormsModule, MatFormFieldModule, MatInputModule]
})
export class CarrierComponent extends ViesRestApi<Carrier, CarrierService> {

  service = inject(CarrierService);
  validForm = signal<boolean>(false);

  services = computed<CarrierServiceLevel[]>(() => this.value()?.services ?? []);

  override getRouteId() {
    const id = RouteUtils.getPathVariable('carriers');
    return id === 'new' ? null : id;
  }

  protected override afterSave(res: Carrier, wasCreate: boolean): void {
    if (wasCreate && res.id) this.router.navigate([APP_ROUTES.rulesCarrier(res.id)]);
  }

  onMainFormChange(v: Carrier) {
    const current = this.value();
    v.apiKey = current?.apiKey ?? '';
    v.apiSecret = current?.apiSecret ?? '';
    v.services = current?.services ?? [];
    this.value.set({ ...v });
  }

  onApiKeyChange(v: string) { this.patch({ apiKey: v ?? '' }); }
  onApiSecretChange(v: string) { this.patch({ apiSecret: v ?? '' }); }

  addService() {
    this.patch({ services: [...this.services(), { code: '', name: '', estimatedDaysMin: null, estimatedDaysMax: null, enabled: true }] });
  }

  onServiceChange(i: number, field: keyof CarrierServiceLevel, v: unknown) {
    const services = this.services().map((s, idx) => idx === i ? { ...s, [field]: v } : s);
    this.patch({ services });
  }

  removeService(i: number) {
    this.patch({ services: this.services().filter((_, idx) => idx !== i) });
  }

  private patch(partial: Partial<Carrier>) {
    const v = this.value();
    if (!v) return;
    this.value.set({ ...v, ...partial });
  }

  backToList() {
    this.router.navigate([APP_ROUTES.rulesCarrierList]);
  }

  override save() {
    const v = this._value.value();
    if (v) {
      v.services = (v.services ?? []).map(s => ({
        ...s,
        code: (s.code ?? '').trim().toLowerCase(),
        estimatedDaysMin: Number(s.estimatedDaysMin) > 0 ? Number(s.estimatedDaysMin) : null,
        estimatedDaysMax: Number(s.estimatedDaysMax) > 0 ? Number(s.estimatedDaysMax) : null,
        enabled: s.enabled !== false
      }));
    }
    super.save();
  }

  override async remove() {
    if (!this.id()) return;
    const confirmed = await this.dialogUtils.openConfirmDialog('Delete carrier?',
      `Delete "${this.value()?.name}"? Shipping rules bound to it become unavailable.`, 'Delete', 'Cancel').catch(() => false);
    if (!confirmed) return;
    this.service.delete(this.id()).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: () => this.backToList(),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
}
