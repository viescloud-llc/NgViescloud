import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { APP_ROUTES } from '../../../app.routes';
import { ShippingRule } from '../../../shared/model/commerce.model';
import { ShippingRuleService } from '../../../shared/service/shipping-rule/shipping-rule.service';

// Shipping-rule registry at /rules/shipping/list — one row per currency
// (DB-unique), so no search/filter needed; the list stays tiny by design.
@Component({
  selector: 'app-shipping-rule-list',
  templateUrl: './shipping-rule-list.component.html',
  styleUrls: ['./shipping-rule-list.component.scss'],
  imports: [NgComponentModule]
})
export class ShippingRuleListComponent extends ViesMatFormFieldMap implements OnInit {

  protected readonly rxjsUtils = inject(RxJSUtils);
  protected readonly dialogUtils = inject(DialogUtils);
  protected readonly shippingRuleService = inject(ShippingRuleService);
  protected readonly router = inject(Router);

  rules = signal<ShippingRule[]>([]);
  blankRule = new ShippingRule();

  ngOnInit(): void {
    this.refresh();
  }

  refresh() {
    this.shippingRuleService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => this.rules.set(res),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  addRule() {
    this.router.navigate([APP_ROUTES.rulesShippingNew]);
  }

  selectRule(rule: ShippingRule) {
    if (!rule.id) return;
    this.router.navigate([APP_ROUTES.rulesShipping(rule.id)]);
  }
}
