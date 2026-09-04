import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesRestApi } from '../../../../lib/abtract/ViesRestApi';
import { RouteUtils } from '../../../../lib/util/Route.utils';
import { ViesDateTime } from '../../../../lib/model/vies.model';
import { APP_ROUTES } from '../../../app.routes';
import { Discount, DiscountType } from '../../../shared/model/commerce.model';
import { DiscountService } from '../../../shared/service/discount/discount.service';
import { MatOption } from '../../../../lib/model/mat.model';
import { Category, Tag } from '../../../shared/model/product.model';
import { AttributeDefinition } from '../../../shared/model/attribute.model';
import { TagService } from '../../../shared/service/tag/tag.service';
import { CategoryService } from '../../../shared/service/category/category.service';
import { AttributeDefinitionService } from '../../../shared/service/attribute-definition/attribute-definition.service';

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
export class DiscountComponent extends ViesRestApi<Discount, DiscountService> implements OnInit {

  service = inject(DiscountService);
  private tagService = inject(TagService);
  private categoryService = inject(CategoryService);
  private attributeDefinitionService = inject(AttributeDefinitionService);

  tagOptions = signal<MatOption<Tag>[]>([]);
  categoryOptions = signal<MatOption<Category>[]>([]);
  attributeDefinitionOptions = signal<MatOption<AttributeDefinition>[]>([]);

  // Product-scoped discounts apply only to matching lines (any overlap; categories incl. sub-categories).
  isScoped = computed<boolean>(() => {
    const v = this.value();
    return !!v && ((v.tags?.length ?? 0) > 0 || (v.categories?.length ?? 0) > 0 || (v.attributeDefinitions?.length ?? 0) > 0);
  });

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

  // The blank Discount's validFrom/validTo are `new ViesDateTime()` — all-zero
  // but truthy, so the `??` defaults in onMainFormChange never fire and an
  // untouched form would persist a year-0 window no checkout can ever satisfy.
  // Seed a real window (now → now + 1 year) for the create case.
  override ngOnInit(): void {
    super.ngOnInit();
    this.tagService.getAll().subscribe({ next: res => this.tagOptions.set((res ?? []).map(t => ({ value: t, valueLabel: t.name || '(unnamed)' }))), error: () => {} });
    this.categoryService.getAll().subscribe({ next: res => this.categoryOptions.set((res ?? []).map(c => ({ value: c, valueLabel: c.name || '(unnamed)' }))), error: () => {} });
    this.attributeDefinitionService.getAll().subscribe({ next: res => this.attributeDefinitionOptions.set((res ?? []).map(d => ({ value: d, valueLabel: d.displayName || d.name }))), error: () => {} });
    if (!this.getRouteId()) {
      const v = this.value();
      if (v) {
        if (!v.validFrom?.year) {
          v.validFrom = ViesDateTime.now();
        }
        if (!v.validTo?.year) {
          const inOneYear = new Date();
          inOneYear.setFullYear(inOneYear.getFullYear() + 1);
          v.validTo = ViesDateTime.fromJsDate(inOneYear);
        }
        // _value.set (not value.set) so the seeded dates become the tracking
        // baseline — Save stays disabled until the admin actually edits.
        this._value.set({ ...v });
      }
    }
  }

  // After a create, leave /new for the entity's real edit URL so
  // refresh/bookmark/back work.
  protected override afterSave(res: Discount, wasCreate: boolean): void {
    if (wasCreate && res.id) {
      this.router.navigate([APP_ROUTES.commerceDiscount(res.id)]);
    }
  }

  // Preserve the hidden fields the dynamic form doesn't render (window + product matchers).
  onMainFormChange(v: Discount) {
    const current = this.value();
    v.validFrom = current?.validFrom ?? ViesDateTime.now();
    v.validTo = current?.validTo ?? ViesDateTime.now();
    v.tags = current?.tags ?? [];
    v.categories = current?.categories ?? [];
    v.attributeDefinitions = current?.attributeDefinitions ?? [];
    this.value.set({ ...v });
  }

  onTagsChange(tags: Tag[]) { this.patch({ tags: tags ?? [] }); }
  onCategoriesChange(categories: Category[]) { this.patch({ categories: categories ?? [] }); }
  onAttributeDefinitionsChange(defs: AttributeDefinition[]) { this.patch({ attributeDefinitions: defs ?? [] }); }

  private patch(partial: Partial<Discount>) {
    const v = this.value();
    if (!v) return;
    this.value.set({ ...v, ...partial });
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
