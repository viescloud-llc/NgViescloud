import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatRadioModule } from '@angular/material/radio';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { APP_ROUTES } from '../../../app.routes';
import { TaxRule } from '../../../shared/model/commerce.model';
import { Category, Product } from '../../../shared/model/product.model';
import { MatOption } from '../../../../lib/model/mat.model';
import { ProductService } from '../../../shared/service/product/product.service';
import { CategoryService } from '../../../shared/service/category/category.service';
import { TaxRuleService } from '../../../shared/service/tax-rule/tax-rule.service';
import { TaxRuleImportExportService, TaxRuleImportMode } from '../../../shared/service/tax-rule-import-export/tax-rule-import-export.service';

// Tax-rule registry at /rules/tax/list.
//
// Rows are sorted by (specificity DESC, priority DESC) — the exact order the
// backend evaluates matchers in — so the table literally reads as "first rule
// whose matchers pass wins". Specificity = number of non-empty matcher fields.
//
// Also hosts:
//   • Export → downloads the full registry as JSON.
//   • Import → file picker + append/replace mode. Replace deletes every
//     existing rule first (transactional server-side) — confirm shows the
//     count that will be wiped.
//   • Test pad — type a shipping address, see which rule wins and the rate.
//     Client-side reproduction of the matching algorithm; informational only.
@Component({
  selector: 'app-tax-rule-list',
  templateUrl: './tax-rule-list.component.html',
  styleUrls: ['./tax-rule-list.component.scss'],
  imports: [NgComponentModule, MatRadioModule]
})
export class TaxRuleListComponent extends ViesMatFormFieldMap implements OnInit {

  protected readonly rxjsUtils = inject(RxJSUtils);
  protected readonly dialogUtils = inject(DialogUtils);
  protected readonly taxRuleService = inject(TaxRuleService);
  protected readonly importExportService = inject(TaxRuleImportExportService);
  protected readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);

  rules = signal<TaxRule[]>([]);
  blankRule = new TaxRule();

  // Backend evaluation order: active rules, specificity DESC, priority DESC.
  sortedRules = computed<TaxRule[]>(() =>
    [...this.rules()].sort((a, b) => {
      const spec = this.specificity(b) - this.specificity(a);
      if (spec !== 0) return spec;
      return (b.priority ?? 0) - (a.priority ?? 0);
    })
  );

  // ---- Test pad state --------------------------------------------------------
  testCountry = signal<string>('');
  testState = signal<string>('');
  testCity = signal<string>('');
  testPostalCode = signal<string>('');
  testDistrict = signal<string>('');
  testProduct = signal<Product | null>(null);

  // Pools for the product-aware test pad (product picker + category ancestry).
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  productOptions = computed<MatOption<Product>[]>(() =>
    this.products().map(p => ({ value: p, valueLabel: `${p.name || '(unnamed)'}${p.baseSku ? ' — ' + p.baseSku : ''}` }))
  );

  testResult = computed<{ rule: TaxRule | null; checked: boolean }>(() => {
    const addr = {
      country: this.testCountry().trim(), state: this.testState().trim(), city: this.testCity().trim(),
      postalCode: this.testPostalCode().trim(), district: this.testDistrict().trim()
    };
    const product = this.testProduct();
    if (!addr.country && !addr.state && !addr.city && !addr.postalCode && !addr.district && !product) {
      return { rule: null, checked: false };
    }
    const candidates = this.sortedRules().filter(r => r.active && this.matchesLocation(r, addr) && this.matchesProduct(r, product));
    // sortedRules is already in eval order → first candidate wins.
    return { rule: candidates[0] ?? null, checked: true };
  });

  onTestProductChange(p: Product | string | null | undefined) {
    if (typeof p === 'string') { if (p !== '') return; p = null; } // partial typing vs clear
    this.testProduct.set(p ?? null);
  }

  // Mirror of TaxRule.matchesLocation on the backend: set matchers must equal
  // the address field (case-insensitive); country/state also accept aliases.
  private matchesLocation(r: TaxRule, a: { country: string; state: string; city: string; postalCode: string; district: string }): boolean {
    const eq = (m: string | undefined, actual: string) => !!m && !!actual && m.trim().toLowerCase() === actual.trim().toLowerCase();
    const withAliases = (m: string | undefined, aliases: string[] | undefined, actual: string) =>
      eq(m, actual) || (aliases ?? []).some(al => eq(al, actual));
    const set = (m: string | undefined) => !!m && m.trim() !== '';
    if (set(r.country) && !withAliases(r.country, r.countryAliases, a.country)) return false;
    if (set(r.state) && !withAliases(r.state, r.stateAliases, a.state)) return false;
    if (set(r.city) && !eq(r.city, a.city)) return false;
    if (set(r.postalCode) && !eq(r.postalCode, a.postalCode)) return false;
    if (set(r.district) && !eq(r.district, a.district)) return false;
    return true;
  }

  // Mirror of TaxRule.matchesProduct: empty matcher = any; set matcher needs ANY overlap.
  // Categories include the product's ancestors (built from the category pool).
  private matchesProduct(r: TaxRule, product: Product | null): boolean {
    const hasTags = (r.tags?.length ?? 0) > 0, hasCats = (r.categories?.length ?? 0) > 0, hasDefs = (r.attributeDefinitions?.length ?? 0) > 0;
    if (!hasTags && !hasCats && !hasDefs) return true;
    if (!product) return false; // product-level rules need a product to evaluate
    const tagIds = new Set((product.tags ?? []).map(t => t.id));
    const catIds = this.categoryChain(product.category?.id);
    const defIds = new Set<string>();
    (product.attributes ?? []).forEach(a => { if (a.attributeDefinition?.id) defIds.add(a.attributeDefinition.id); });
    (product.variants ?? []).forEach(v => (v.attributeValues ?? []).forEach(a => { if (a.attributeDefinition?.id) defIds.add(a.attributeDefinition.id); }));
    if (hasTags && !r.tags.some(t => tagIds.has(t.id))) return false;
    if (hasCats && !r.categories.some(c => catIds.has(c.id))) return false;
    if (hasDefs && !r.attributeDefinitions.some(d => defIds.has(d.id))) return false;
    return true;
  }

  private categoryChain(categoryId: string | undefined): Set<string> {
    const chain = new Set<string>();
    const byId = new Map(this.categories().map(c => [c.id, c]));
    let current = categoryId ? byId.get(categoryId) : undefined;
    while (current?.id && !chain.has(current.id)) {
      chain.add(current.id);
      current = current.parentCategoryId ? byId.get(current.parentCategoryId) : undefined;
    }
    return chain;
  }

  ngOnInit(): void {
    this.refresh();
  }

  refresh() {
    this.taxRuleService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => this.rules.set(res),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
    this.productService.getAll().subscribe({ next: res => this.products.set(res ?? []), error: () => this.products.set([]) });
    this.categoryService.getAll().subscribe({ next: res => this.categories.set(res ?? []), error: () => this.categories.set([]) });
  }

  // Backend TaxRule.specificity(): set location matchers + set product matchers (aliases don't count).
  specificity(rule: TaxRule): number {
    const location = [rule.country, rule.state, rule.city, rule.postalCode, rule.district]
      .filter(f => !!f && f.trim() !== '').length;
    const product = [rule.tags, rule.categories, rule.attributeDefinitions].filter(a => (a?.length ?? 0) > 0).length;
    return location + product;
  }

  addRule() {
    this.router.navigate([APP_ROUTES.rulesTaxNew]);
  }

  selectRule(rule: TaxRule) {
    if (!rule.id) return;
    this.router.navigate([APP_ROUTES.rulesTax(rule.id)]);
  }

  // ---- Export ----------------------------------------------------------------

  exportRules() {
    this.importExportService.exportRules().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: rules => {
        const blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tax-rules.json';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  // ---- Import ----------------------------------------------------------------

  importMode = signal<TaxRuleImportMode>('append');

  async onImportFilePicked(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow re-picking the same file
    if (!file) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      this.dialogUtils.openErrorMessage('Invalid file', 'The selected file is not valid JSON.');
      return;
    }
    if (!Array.isArray(parsed)) {
      this.dialogUtils.openErrorMessage('Invalid file', 'Expected a JSON array of tax rules.');
      return;
    }

    const mode = this.importMode();
    const message = mode === 'replace'
      ? `Import ${parsed.length} rule(s) in REPLACE mode. All ${this.rules().length} existing rule(s) will be DELETED first. Continue?`
      : `Import ${parsed.length} rule(s) in append mode (existing rules untouched). Continue?`;
    const confirmed = await this.dialogUtils.openConfirmDialog('Import tax rules', message, 'Import', 'Cancel').catch(() => false);
    if (!confirmed) return;

    try {
      const result = await firstValueFrom(
        this.importExportService.importRules(parsed as TaxRule[], mode).pipe(this.rxjsUtils.waitLoadingDialog())
      );
      this.dialogUtils.openErrorMessage(
        'Import complete',
        `Imported ${result.imported} rule(s)` + (result.replaced ? `, replaced ${result.replaced}.` : '.')
      );
      this.refresh();
    } catch (err) {
      this.dialogUtils.openErrorMessageFromError(err);
    }
  }
}
