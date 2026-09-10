import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesRestApi } from '../../../../lib/abtract/ViesRestApi';
import { RouteUtils } from '../../../../lib/util/Route.utils';
import { MatOption } from '../../../../lib/model/mat.model';
import { APP_ROUTES } from '../../../app.routes';
import { SHIPPING_STRATEGY_LABELS, ShippingRule, ShippingStrategy, ShippingTier } from '../../../shared/model/commerce.model';
import { Category, Tag } from '../../../shared/model/product.model';
import { AttributeDefinition } from '../../../shared/model/attribute.model';
import { ShippingRuleService } from '../../../shared/service/shipping-rule/shipping-rule.service';
import { TagService } from '../../../shared/service/tag/tag.service';
import { CategoryService } from '../../../shared/service/category/category.service';
import { AttributeDefinitionService } from '../../../shared/service/attribute-definition/attribute-definition.service';
import { Warehouse } from '../../../shared/model/inventory.model';
import { Carrier } from '../../../shared/model/shipping.model';
import { WarehouseService } from '../../../shared/service/warehouse/warehouse.service';
import { CarrierService } from '../../../shared/service/carrier/carrier.service';

// Shipping METHOD editor at /rules/shipping/{new,:id}.
//
// Three parts: (1) the decorator-driven form — name, currency, active,
// priority, location matchers and the cross-cutting modifiers; (2) aliases +
// product-matcher pickers (same pattern as the tax rule editor); (3) the
// Pricing section, hidden from the dynamic form because its fields depend on
// the chosen strategy: a flat fee, base + per item, an ordered tier table with
// optional overage, or a carrier code for the (future) live-rate integration.
//
// BigDecimal optionals travel as '' in the form and are stripped to absent on
// save (Jackson rejects "" for BigDecimal).
@Component({
  selector: 'app-shipping-rule',
  templateUrl: './shipping-rule.component.html',
  styleUrls: ['./shipping-rule.component.scss'],
  imports: [NgComponentModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule]
})
export class ShippingRuleComponent extends ViesRestApi<ShippingRule, ShippingRuleService> implements OnInit {

  service = inject(ShippingRuleService);
  private tagService = inject(TagService);
  private categoryService = inject(CategoryService);
  private attributeDefinitionService = inject(AttributeDefinitionService);

  validForm = signal<boolean>(false);

  readonly ShippingStrategy = ShippingStrategy;
  readonly strategyOptions = (Object.values(ShippingStrategy) as ShippingStrategy[])
    .map(s => ({ value: s, label: SHIPPING_STRATEGY_LABELS[s] }));

  private warehouseService = inject(WarehouseService);
  private carrierService = inject(CarrierService);
  warehouses = signal<Warehouse[]>([]);
  carriers = signal<Carrier[]>([]);
  selectedCarrier = computed<Carrier | null>(() => this.carriers().find(c => c.id === this.value()?.carrierId) ?? null);

  tagOptions = signal<MatOption<Tag>[]>([]);
  categoryOptions = signal<MatOption<Category>[]>([]);
  attributeDefinitionOptions = signal<MatOption<AttributeDefinition>[]>([]);

  strategy = computed<ShippingStrategy>(() => this.value()?.strategy ?? ShippingStrategy.FLAT);
  isTiered = computed<boolean>(() => [ShippingStrategy.WEIGHT_TIERED, ShippingStrategy.PRICE_TIERED, ShippingStrategy.ITEM_TIERED].includes(this.strategy()));
  tierUnit = computed<string>(() => {
    switch (this.strategy()) {
      case ShippingStrategy.WEIGHT_TIERED: return 'g';
      case ShippingStrategy.PRICE_TIERED: return this.value()?.currency ?? '';
      case ShippingStrategy.ITEM_TIERED: return 'item(s)';
      default: return '';
    }
  });
  tiers = computed<ShippingTier[]>(() => this.value()?.tiers ?? []);

  countryAliasText = computed<string>(() => (this.value()?.countryAliases ?? []).join(', '));
  stateAliasText = computed<string>(() => (this.value()?.stateAliases ?? []).join(', '));

  locationSpecificity = computed<number>(() => {
    const v = this.value();
    if (!v) return 0;
    return [v.country, v.state, v.city, v.postalCode, v.district].filter(f => !!f && f.trim() !== '').length;
  });
  productSpecificity = computed<number>(() => {
    const v = this.value();
    if (!v) return 0;
    return [v.tags, v.categories, v.attributeDefinitions].filter(a => (a?.length ?? 0) > 0).length;
  });
  specificity = computed<number>(() => this.locationSpecificity() + this.productSpecificity());

  override getRouteId() {
    const id = RouteUtils.getPathVariable('shipping');
    return id === 'new' ? null : id;
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.tagService.getAll().subscribe({ next: res => this.tagOptions.set((res ?? []).map(t => ({ value: t, valueLabel: t.name || '(unnamed)' }))), error: () => {} });
    this.categoryService.getAll().subscribe({ next: res => this.categoryOptions.set((res ?? []).map(c => ({ value: c, valueLabel: c.name || '(unnamed)' }))), error: () => {} });
    this.attributeDefinitionService.getAll().subscribe({ next: res => this.attributeDefinitionOptions.set((res ?? []).map(d => ({ value: d, valueLabel: d.displayName || d.name }))), error: () => {} });
    this.warehouseService.getAll().subscribe({ next: res => this.warehouses.set(res ?? []), error: () => {} });
    this.carrierService.getAll().subscribe({ next: res => this.carriers.set(res ?? []), error: () => {} });
  }

  onOriginWarehouseChange(id: string) { this.patch({ originWarehouseId: id || null }); }
  onCarrierChange(id: string) { this.patch({ carrierId: id || null, carrierServiceCode: '' }); }

  protected override afterSave(res: ShippingRule, wasCreate: boolean): void {
    if (wasCreate && res.id) {
      this.router.navigate([APP_ROUTES.rulesShipping(res.id)]);
    }
  }

  // The dynamic form doesn't render the hidden fields — preserve them.
  onMainFormChange(v: ShippingRule) {
    const current = this.value();
    v.countryAliases = current?.countryAliases ?? [];
    v.stateAliases = current?.stateAliases ?? [];
    v.tags = current?.tags ?? [];
    v.categories = current?.categories ?? [];
    v.attributeDefinitions = current?.attributeDefinitions ?? [];
    v.strategy = current?.strategy ?? ShippingStrategy.FLAT;
    v.flatFee = current?.flatFee;
    v.perItemFee = current?.perItemFee;
    v.tiers = current?.tiers ?? [];
    v.overageStep = current?.overageStep;
    v.overagePrice = current?.overagePrice;
    v.carrierId = current?.carrierId;
    v.carrierServiceCode = current?.carrierServiceCode;
    v.originWarehouseId = current?.originWarehouseId;
    this.value.set({ ...v });
  }

  onCountryAliasesChange(text: string) { this.patch({ countryAliases: this.splitAliases(text) }); }
  onStateAliasesChange(text: string) { this.patch({ stateAliases: this.splitAliases(text) }); }
  onTagsChange(tags: Tag[]) { this.patch({ tags: tags ?? [] }); }
  onCategoriesChange(categories: Category[]) { this.patch({ categories: categories ?? [] }); }
  onAttributeDefinitionsChange(defs: AttributeDefinition[]) { this.patch({ attributeDefinitions: defs ?? [] }); }

  // ---- Pricing section ------------------------------------------------------

  onStrategyChange(s: ShippingStrategy) { this.patch({ strategy: s }); }
  onFlatFeeChange(v: string) { this.patch({ flatFee: v }); }
  onPerItemFeeChange(v: string) { this.patch({ perItemFee: v }); }
  onOverageStepChange(v: string) { this.patch({ overageStep: v }); }
  onOveragePriceChange(v: string) { this.patch({ overagePrice: v }); }
  onCarrierServiceCodeChange(v: string) { this.patch({ carrierServiceCode: v }); }

  addTier() {
    const tiers = [...this.tiers()];
    const last = tiers[tiers.length - 1];
    const nextUpTo = last ? Number(last.upTo) * 2 : (this.strategy() === ShippingStrategy.ITEM_TIERED ? 1 : 1000);
    tiers.push({ upTo: nextUpTo, price: last ? last.price : '0' });
    this.patch({ tiers });
  }

  onTierUpToChange(i: number, v: string | number) {
    const tiers = this.tiers().map((t, idx) => idx === i ? { ...t, upTo: v } : t);
    this.patch({ tiers });
  }

  onTierPriceChange(i: number, v: string) {
    const tiers = this.tiers().map((t, idx) => idx === i ? { ...t, price: v } : t);
    this.patch({ tiers });
  }

  removeTier(i: number) {
    this.patch({ tiers: this.tiers().filter((_, idx) => idx !== i) });
  }

  private patch(partial: Partial<ShippingRule>) {
    const v = this.value();
    if (!v) return;
    this.value.set({ ...v, ...partial });
  }

  private splitAliases(text: string): string[] {
    return [...new Set((text ?? '').split(',').map(a => a.trim()).filter(a => a.length > 0))];
  }

  backToList() {
    this.router.navigate([APP_ROUTES.rulesShippingList]);
  }

  // '' → absent for every optional BigDecimal; 0 → absent for the day estimates;
  // tiers sorted so the server sees what the admin sees.
  override save() {
    const v = this._value.value();
    if (v) {
      const decimals: (keyof ShippingRule)[] = ['flatFee', 'perItemFee', 'overageStep', 'overagePrice', 'freeAboveAmount', 'handlingFee', 'minCharge', 'maxCharge'];
      for (const k of decimals) {
        const raw = v[k] as unknown;
        if (raw === '' || raw === null) (v as any)[k] = undefined;
      }
      (v as any).estimatedDaysMin = Number(v.estimatedDaysMin) > 0 ? Number(v.estimatedDaysMin) : undefined;
      (v as any).estimatedDaysMax = Number(v.estimatedDaysMax) > 0 ? Number(v.estimatedDaysMax) : undefined;
      if (!v.carrierId) (v as any).carrierId = undefined;
      if (!v.originWarehouseId) (v as any).originWarehouseId = undefined;
      if (!v.carrierServiceCode) (v as any).carrierServiceCode = undefined;
      v.tiers = [...(v.tiers ?? [])]
        .map(t => ({ upTo: Number(t.upTo), price: String(t.price ?? '0') }))
        .sort((a, b) => a.upTo - b.upTo);
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
