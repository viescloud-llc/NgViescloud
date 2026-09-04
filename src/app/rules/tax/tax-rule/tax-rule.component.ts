import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesRestApi } from '../../../../lib/abtract/ViesRestApi';
import { RouteUtils } from '../../../../lib/util/Route.utils';
import { MatOption } from '../../../../lib/model/mat.model';
import { APP_ROUTES } from '../../../app.routes';
import { TaxRule } from '../../../shared/model/commerce.model';
import { Category, Tag } from '../../../shared/model/product.model';
import { AttributeDefinition } from '../../../shared/model/attribute.model';
import { TaxRuleService } from '../../../shared/service/tax-rule/tax-rule.service';
import { TagService } from '../../../shared/service/tag/tag.service';
import { CategoryService } from '../../../shared/service/category/category.service';
import { AttributeDefinitionService } from '../../../shared/service/attribute-definition/attribute-definition.service';

// TaxRule editor at /rules/tax/{new,:id}.
//
// Location matchers (country/state/city/postalCode/district) come from the
// decorator-driven form; country and state additionally accept ALIAS lists
// ("United States", "USA") entered comma-separated. Product matchers
// (tags / categories / attribute definitions) are multi-select pickers over
// the global pools — empty = any product; non-empty = the product must carry
// ANY of them (categories include descendants). Specificity = number of set
// matchers (aliases don't count); ties go to Priority.
@Component({
  selector: 'app-tax-rule',
  templateUrl: './tax-rule.component.html',
  styleUrls: ['./tax-rule.component.scss'],
  imports: [NgComponentModule]
})
export class TaxRuleComponent extends ViesRestApi<TaxRule, TaxRuleService> implements OnInit {

  service = inject(TaxRuleService);
  private tagService = inject(TagService);
  private categoryService = inject(CategoryService);
  private attributeDefinitionService = inject(AttributeDefinitionService);

  validForm = signal<boolean>(false);

  tagOptions = signal<MatOption<Tag>[]>([]);
  categoryOptions = signal<MatOption<Category>[]>([]);
  attributeDefinitionOptions = signal<MatOption<AttributeDefinition>[]>([]);

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

  specificityLabel = computed<string>(() => {
    const loc = this.locationSpecificity();
    const prod = this.productSpecificity();
    const locLabel = loc === 0 ? 'any address' : `${loc} location matcher${loc > 1 ? 's' : ''}`;
    const prodLabel = prod === 0 ? 'any product' : `${prod} product matcher${prod > 1 ? 's' : ''}`;
    return `${locLabel}, ${prodLabel}`;
  });

  countryAliasText = computed<string>(() => (this.value()?.countryAliases ?? []).join(', '));
  stateAliasText = computed<string>(() => (this.value()?.stateAliases ?? []).join(', '));

  override getRouteId() {
    const id = RouteUtils.getPathVariable('tax');
    return id === 'new' ? null : id;
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.tagService.getAll().subscribe({
      next: res => this.tagOptions.set((res ?? []).map(t => ({ value: t, valueLabel: t.name || '(unnamed)' }))),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
    this.categoryService.getAll().subscribe({
      next: res => this.categoryOptions.set((res ?? []).map(c => ({ value: c, valueLabel: c.name || '(unnamed)' }))),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
    this.attributeDefinitionService.getAll().subscribe({
      next: res => this.attributeDefinitionOptions.set((res ?? []).map(d => ({ value: d, valueLabel: d.displayName || d.name }))),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  protected override afterSave(res: TaxRule, wasCreate: boolean): void {
    if (wasCreate && res.id) {
      this.router.navigate([APP_ROUTES.rulesTax(res.id)]);
    }
  }

  // The dynamic form doesn't render the hidden alias/product fields — preserve them.
  onMainFormChange(v: TaxRule) {
    const current = this.value();
    v.countryAliases = current?.countryAliases ?? [];
    v.stateAliases = current?.stateAliases ?? [];
    v.tags = current?.tags ?? [];
    v.categories = current?.categories ?? [];
    v.attributeDefinitions = current?.attributeDefinitions ?? [];
    this.value.set({ ...v });
  }

  onCountryAliasesChange(text: string) {
    this.patch({ countryAliases: this.splitAliases(text) });
  }

  onStateAliasesChange(text: string) {
    this.patch({ stateAliases: this.splitAliases(text) });
  }

  onTagsChange(tags: Tag[]) { this.patch({ tags: tags ?? [] }); }
  onCategoriesChange(categories: Category[]) { this.patch({ categories: categories ?? [] }); }
  onAttributeDefinitionsChange(defs: AttributeDefinition[]) { this.patch({ attributeDefinitions: defs ?? [] }); }

  private patch(partial: Partial<TaxRule>) {
    const v = this.value();
    if (!v) return;
    this.value.set({ ...v, ...partial });
  }

  private splitAliases(text: string): string[] {
    return [...new Set((text ?? '').split(',').map(a => a.trim()).filter(a => a.length > 0))];
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
