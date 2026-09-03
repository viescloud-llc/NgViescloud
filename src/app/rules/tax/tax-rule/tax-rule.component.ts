import { Component, computed, inject, signal } from '@angular/core';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesRestApi } from '../../../../lib/abtract/ViesRestApi';
import { RouteUtils } from '../../../../lib/util/Route.utils';
import { APP_ROUTES } from '../../../app.routes';
import { TaxRule } from '../../../shared/model/commerce.model';
import { TaxRuleService } from '../../../shared/service/tax-rule/tax-rule.service';

// TaxRule editor at /rules/tax/{new,:id}. All fields come straight from the
// decorator-driven form — each location matcher's placeholder already says
// "Empty = match any". A live specificity readout under the form shows where
// the rule will slot into the evaluation order.
@Component({
  selector: 'app-tax-rule',
  templateUrl: './tax-rule.component.html',
  styleUrls: ['./tax-rule.component.scss'],
  imports: [NgComponentModule]
})
export class TaxRuleComponent extends ViesRestApi<TaxRule, TaxRuleService> {

  service = inject(TaxRuleService);

  validForm = signal<boolean>(false);

  specificity = computed<number>(() => {
    const v = this.value();
    if (!v) return 0;
    return [v.country, v.state, v.city, v.postalCode]
      .filter(f => !!f && f.trim() !== '').length;
  });

  specificityLabel = computed<string>(() => {
    switch (this.specificity()) {
      case 0: return 'catch-all (matches every address)';
      case 1: return 'country-level';
      case 2: return 'state-level';
      case 3: return 'city-level';
      default: return 'postal-code-level (most specific)';
    }
  });

  override getRouteId() {
    const id = RouteUtils.getPathVariable('tax');
    return id === 'new' ? null : id;
  }

  // After a create, leave /new for the entity's real edit URL so
  // refresh/bookmark/back work.
  protected override afterSave(res: TaxRule, wasCreate: boolean): void {
    if (wasCreate && res.id) {
      this.router.navigate([APP_ROUTES.rulesTax(res.id)]);
    }
  }

  onMainFormChange(v: TaxRule) {
    this.value.set({ ...v });
  }

  backToList() {
    this.router.navigate([APP_ROUTES.rulesTaxList]);
  }

  override async remove() {
    if (!this.id()) return;
    const confirmed = await this.dialogUtils.openCascadeDeleteConfirm('tax rule');
    if (!confirmed) return;
    this.service.delete(this.id()).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: () => this.backToList(),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
}
