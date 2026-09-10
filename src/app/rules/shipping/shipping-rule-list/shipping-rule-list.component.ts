import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { Currency } from '../../../../lib/model/currency.model';
import { MatOption } from '../../../../lib/model/mat.model';
import { APP_ROUTES } from '../../../app.routes';
import { ShippingQuote, ShippingRule } from '../../../shared/model/commerce.model';
import { Address } from '../../../shared/model/address.model';
import { ProductVariant } from '../../../shared/model/product.model';
import { ShippingRuleService } from '../../../shared/service/shipping-rule/shipping-rule.service';
import { ProductVariantService } from '../../../shared/service/product-variant/product-variant.service';

// Shipping methods at /rules/shipping/list, sorted the way checkout ranks them
// (specificity DESC, priority DESC), plus a test pad that quotes a synthetic
// cart (variant + quantity lines) to a sample address through the SERVER
// (`POST /shipping/rules/quote`) — so what you see is exactly what checkout
// would offer, breakdown included.
@Component({
  selector: 'app-shipping-rule-list',
  templateUrl: './shipping-rule-list.component.html',
  styleUrls: ['./shipping-rule-list.component.scss'],
  imports: [NgComponentModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule]
})
export class ShippingRuleListComponent extends ViesMatFormFieldMap implements OnInit {

  protected readonly rxjsUtils = inject(RxJSUtils);
  protected readonly dialogUtils = inject(DialogUtils);
  protected readonly shippingRuleService = inject(ShippingRuleService);
  protected readonly router = inject(Router);
  private readonly variantService = inject(ProductVariantService);

  rules = signal<ShippingRule[]>([]);
  blankRule = new ShippingRule();

  sortedRules = computed<ShippingRule[]>(() =>
    [...this.rules()].sort((a, b) => {
      const spec = this.specificity(b) - this.specificity(a);
      if (spec !== 0) return spec;
      return (b.priority ?? 0) - (a.priority ?? 0);
    })
  );

  // ---- Test pad ---------------------------------------------------------------
  testCountry = signal<string>('');
  testState = signal<string>('');
  testCity = signal<string>('');
  testPostalCode = signal<string>('');
  testDistrict = signal<string>('');
  testCurrency = signal<Currency>(Currency.USD);
  testLines = signal<{ variant: ProductVariant | null; quantity: number }[]>([{ variant: null, quantity: 1 }]);
  quote = signal<ShippingQuote | null>(null);
  quoting = signal<boolean>(false);

  variants = signal<ProductVariant[]>([]);
  variantOptions = computed<MatOption<ProductVariant>[]>(() =>
    this.variants().map(v => ({ value: v, valueLabel: `${v.sku}${v.variantName ? ' — ' + v.variantName : ''}${v.fulfillmentType === 'DIGITAL' ? ' (digital)' : ''}` }))
  );
  readonly currencyOptions: MatOption<Currency>[] = Object.values(Currency).map(c => ({ value: c, valueLabel: c }));

  canQuote = computed<boolean>(() => this.testLines().some(l => !!l.variant?.id) && !this.quoting());

  ngOnInit(): void {
    this.refresh();
  }

  refresh() {
    this.shippingRuleService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => this.rules.set(res ?? []),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
    this.variantService.getAll().subscribe({ next: res => this.variants.set(res ?? []), error: () => this.variants.set([]) });
  }

  specificity(rule: ShippingRule): number {
    const location = [rule.country, rule.state, rule.city, rule.postalCode, rule.district].filter(f => !!f && f.trim() !== '').length;
    const product = [rule.tags, rule.categories, rule.attributeDefinitions].filter(a => (a?.length ?? 0) > 0).length;
    return location + product + (rule.originWarehouseId ? 1 : 0);
  }

  addRule() {
    this.router.navigate([APP_ROUTES.rulesShippingNew]);
  }

  selectRule(rule: ShippingRule) {
    if (!rule.id) return;
    this.router.navigate([APP_ROUTES.rulesShipping(rule.id)]);
  }

  // ---- Test pad handlers -------------------------------------------------------

  onTestVariantChange(i: number, v: ProductVariant | string | null | undefined) {
    if (typeof v === 'string') { if (v !== '') return; v = null; }
    this.testLines.set(this.testLines().map((l, idx) => idx === i ? { ...l, variant: v ?? null } : l));
  }

  onTestQtyChange(i: number, q: number | string) {
    this.testLines.set(this.testLines().map((l, idx) => idx === i ? { ...l, quantity: Math.max(1, Number(q) || 1) } : l));
  }

  addTestLine() {
    this.testLines.set([...this.testLines(), { variant: null, quantity: 1 }]);
  }

  removeTestLine(i: number) {
    const lines = this.testLines().filter((_, idx) => idx !== i);
    this.testLines.set(lines.length ? lines : [{ variant: null, quantity: 1 }]);
  }

  runQuote() {
    if (!this.canQuote()) return;
    const address: Address = {
      ...new Address(),
      country: this.testCountry().trim(), state: this.testState().trim(), city: this.testCity().trim(),
      postalCode: this.testPostalCode().trim(), district: this.testDistrict().trim()
    };
    this.quoting.set(true);
    this.shippingRuleService.quote({
      currency: this.testCurrency(),
      shippingAddress: address,
      lines: this.testLines().filter(l => l.variant?.id).map(l => ({ productVariantId: l.variant!.id, quantity: l.quantity }))
    }).subscribe({
      next: q => { this.quote.set(q); this.quoting.set(false); },
      error: err => { this.quoting.set(false); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  eta(min?: number | null, max?: number | null): string {
    if (!min && !max) return '';
    if (min && max) return `${min}–${max} days`;
    return `${min ?? max} days`;
  }
}
