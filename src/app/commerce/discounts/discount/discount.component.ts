import { Component, computed, inject, signal } from '@angular/core';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesRestApi } from '../../../../lib/abtract/ViesRestApi';
import { RouteUtils } from '../../../../lib/util/Route.utils';
import { ViesDateTime } from '../../../../lib/model/vies.model';
import { APP_ROUTES } from '../../../app.routes';
import { Discount, DiscountType } from '../../../shared/model/commerce.model';
import { DiscountService } from '../../../shared/service/discount/discount.service';

// Discount editor at /commerce/discounts/{new,:id}.
//
// `discountType` switches the MEANING of `discountValue` (intent § 5.7) — the
// hint text below the form adapts so admins know what they're typing:
//   PERCENTAGE    → value is a percent (e.g. "25" = 25% off)
//   FIXED_AMOUNT  → value is a currency amount (e.g. "10.00" off)
//   FREE_SHIPPING → value ignored (shipping cost zeroed at checkout)
//   BUY_X_GET_Y   → value encodes the promo (backend interprets)
//
// No client-side validation logic here — the checkout orchestrator enforces
// validity (min order, window, usage caps) at redemption time. `currentUses`
// is server-bumped and read-only. Validity window uses the dedicated
// date pickers (ViesDateTime).
@Component({
  selector: 'app-discount',
  templateUrl: './discount.component.html',
  styleUrls: ['./discount.component.scss'],
  imports: [NgComponentModule]
})
export class DiscountComponent extends ViesRestApi<Discount, DiscountService> {

  service = inject(DiscountService);

  validForm = signal<boolean>(false);

  // Mode-adaptive hint for the discountValue field.
  valueHint = computed<string>(() => {
    switch (this.value()?.discountType) {
      case DiscountType.PERCENTAGE:
        return 'Discount Value is a PERCENT — e.g. 25 means 25% off the order subtotal.';
      case DiscountType.FIXED_AMOUNT:
        return 'Discount Value is a CURRENCY AMOUNT — e.g. 10.00 means 10.00 off (in the cart currency).';
      case DiscountType.FREE_SHIPPING:
        return 'Discount Value is ignored for free-shipping discounts — shipping cost is zeroed at checkout.';
      case DiscountType.BUY_X_GET_Y:
        return 'Buy-X-get-Y promo — Discount Value encodes the promo per the backend contract.';
      default:
        return '';
    }
  });

  override getRouteId() {
    const id = RouteUtils.getPathVariable('discounts');
    return id === 'new' ? null : id;
  }

  // Preserve the hidden validity-window fields the dynamic form doesn't render.
  onMainFormChange(v: Discount) {
    const current = this.value();
    v.validFrom = current?.validFrom ?? ViesDateTime.now();
    v.validTo = current?.validTo ?? ViesDateTime.now();
    this.value.set({ ...v });
  }

  onValidFromChange(dt: ViesDateTime) {
    const v = this.value();
    if (!v) return;
    v.validFrom = dt;
    this.value.set({ ...v });
  }

  onValidToChange(dt: ViesDateTime) {
    const v = this.value();
    if (!v) return;
    v.validTo = dt;
    this.value.set({ ...v });
  }

  backToList() {
    this.router.navigate([APP_ROUTES.commerceDiscountList]);
  }

  override async remove() {
    if (!this.id()) return;
    const confirmed = await this.dialogUtils.openCascadeDeleteConfirm('discount');
    if (!confirmed) return;
    this.service.delete(this.id()).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: () => this.backToList(),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
}
