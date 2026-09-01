import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesRestApi } from '../../../../lib/abtract/ViesRestApi';
import { RouteUtils } from '../../../../lib/util/Route.utils';
import { Currency } from '../../../../lib/model/currency.model';
import { MatOption } from '../../../../lib/model/mat.model';
import { APP_ROUTES } from '../../../app.routes';
import { ShippingRule } from '../../../shared/model/commerce.model';
import { ShippingRuleService } from '../../../shared/service/shipping-rule/shipping-rule.service';

// ShippingRule editor at /rules/shipping/{new,:id}.
//
// The currency picker EXCLUDES currencies that already have a rule (DB-level
// unique constraint) — the current rule's own currency stays available so an
// edit doesn't lock itself out. `freeAboveAmount` empty/null disables the
// free-shipping threshold entirely.
@Component({
  selector: 'app-shipping-rule',
  templateUrl: './shipping-rule.component.html',
  styleUrls: ['./shipping-rule.component.scss'],
  imports: [NgComponentModule]
})
export class ShippingRuleComponent extends ViesRestApi<ShippingRule, ShippingRuleService> implements OnInit {

  service = inject(ShippingRuleService);

  validForm = signal<boolean>(false);

  // All existing rules — used to compute which currencies are taken.
  allRules = signal<ShippingRule[]>([]);

  currencyOptions = computed<MatOption<Currency>[]>(() => {
    const takenByOthers = new Set(
      this.allRules()
        .filter(r => r.id && r.id !== this.id())
        .map(r => r.currency)
    );
    return Object.values(Currency)
      .filter(c => !takenByOthers.has(c))
      .map(c => ({ value: c, valueLabel: c }));
  });

  override getRouteId() {
    const id = RouteUtils.getPathVariable('shipping');
    return id === 'new' ? null : id;
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.service.getAll().subscribe({
      next: res => this.allRules.set(res),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  onMainFormChange(v: ShippingRule) {
    const current = this.value();
    v.currency = current?.currency ?? Currency.USD;
    this.value.set({ ...v });
  }

  onCurrencyChange(c: Currency) {
    const v = this.value();
    if (!v) return;
    v.currency = c;
    this.value.set({ ...v });
  }

  backToList() {
    this.router.navigate([APP_ROUTES.rulesShippingList]);
  }

  // `freeAboveAmount` is BigDecimal on the wire — an empty string ("threshold
  // disabled" in the UI) must go out as null/undefined or Jackson rejects the
  // payload with a 400.
  override save() {
    const v = this._value.value();
    if (v && (v.freeAboveAmount === '' || v.freeAboveAmount === null)) {
      v.freeAboveAmount = undefined;
    }
    super.save();
  }

  override async remove() {
    if (!this.id()) return;
    const confirmed = await this.dialogUtils.openCascadeDeleteConfirm('shipping rule');
    if (!confirmed) return;
    this.service.delete(this.id()).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: () => this.backToList(),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
}
