import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { MatOption } from '../../../../lib/model/mat.model';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { Category, Product, Tag } from '../../model/product.model';
import { AttributeDefinition } from '../../model/attribute.model';
import { ProductSelector, SelectorMatch, SelectorSort } from '../../model/storefront.model';
import { CategoryService } from '../../service/category/category.service';
import { TagService } from '../../service/tag/tag.service';
import { AttributeDefinitionService } from '../../service/attribute-definition/attribute-definition.service';
import { ProductService } from '../../service/product/product.service';
import { StorefrontService } from '../../service/storefront/storefront.service';

// Pinned products + categories / tags / attribute definitions (lib multi-select
// pickers, like the discount editor), match ANY|ALL, sort, limit, live preview.
@Component({
  selector: 'app-product-selector',
  imports: [NgComponentModule],
  templateUrl: './product-selector.component.html',
  styles: [`.row { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin: 0.25rem 0; } .preview { margin-top: 0.25rem; font-size: 0.9rem; opacity: 0.9; }`]
})
export class ProductSelectorComponent extends ViesMatFormFieldMap implements OnInit {
  private readonly categories = inject(CategoryService);
  private readonly tags = inject(TagService);
  private readonly defs = inject(AttributeDefinitionService);
  private readonly products = inject(ProductService);
  private readonly sf = inject(StorefrontService);
  private readonly dialogUtils = inject(DialogUtils);

  value = input.required<ProductSelector>();
  disabled = input<boolean>(false);
  valueChange = output<ProductSelector>();

  productOptions = signal<MatOption<Product>[]>([]);
  categoryOptions = signal<MatOption<Category>[]>([]);
  tagOptions = signal<MatOption<Tag>[]>([]);
  defOptions = signal<MatOption<AttributeDefinition>[]>([]);
  readonly matchOptions: MatOption<SelectorMatch>[] = [{ value: SelectorMatch.ANY, valueLabel: 'Any criterion' }, { value: SelectorMatch.ALL, valueLabel: 'All criteria' }];
  readonly sortOptions: MatOption<SelectorSort>[] = [
    { value: SelectorSort.NEWEST, valueLabel: 'Newest first' }, { value: SelectorSort.PRICE_ASC, valueLabel: 'Price low → high' },
    { value: SelectorSort.PRICE_DESC, valueLabel: 'Price high → low' }, { value: SelectorSort.NAME, valueLabel: 'Name' }, { value: SelectorSort.MANUAL, valueLabel: 'Manual (pinned order)' }
  ];
  matches = signal<Product[] | null>(null);

  pinnedProducts = computed<Product[]>(() => this.value().productIds.map(id => this.productOptions().find(o => o.value.id === id)?.value).filter((p): p is Product => !!p));
  selectedCategories = computed<Category[]>(() => this.categoryOptions().filter(o => this.value().categoryIds.includes(o.value.id)).map(o => o.value));
  selectedTags = computed<Tag[]>(() => this.tagOptions().filter(o => this.value().tagIds.includes(o.value.id)).map(o => o.value));
  selectedDefs = computed<AttributeDefinition[]>(() => this.defOptions().filter(o => this.value().attributeDefinitionIds.includes(o.value.id)).map(o => o.value));

  ngOnInit(): void {
    this.products.getAll().subscribe({ next: p => this.productOptions.set((p ?? []).filter(x => x.status === 'ACTIVE').map(x => ({ value: x, valueLabel: `${x.name} (${x.baseSku || 'no SKU'})` }))), error: () => {} });
    this.categories.getAll().subscribe({ next: c => this.categoryOptions.set((c ?? []).map(x => ({ value: x, valueLabel: x.name || '(unnamed)' }))), error: () => {} });
    this.tags.getAll().subscribe({ next: t => this.tagOptions.set((t ?? []).map(x => ({ value: x, valueLabel: x.name || '(unnamed)' }))), error: () => {} });
    this.defs.getAll().subscribe({ next: d => this.defOptions.set((d ?? []).map(x => ({ value: x, valueLabel: x.displayName || x.name }))), error: () => {} });
  }

  private set<K extends keyof ProductSelector>(k: K, v: ProductSelector[K]) { this.valueChange.emit({ ...this.value(), [k]: v }); this.matches.set(null); }
  onProducts(list: Product[]) { this.set('productIds', (list ?? []).map(p => p.id)); }
  onCategories(list: Category[]) { this.set('categoryIds', (list ?? []).map(c => c.id)); }
  onTags(list: Tag[]) { this.set('tagIds', (list ?? []).map(t => t.id)); }
  onDefs(list: AttributeDefinition[]) { this.set('attributeDefinitionIds', (list ?? []).map(d => d.id)); }
  onMatch(m: SelectorMatch) { this.set('match', m); }
  onSort(s: SelectorSort) { this.set('sort', s); }
  onLimit(v: number | string) { this.set('limit', Math.max(1, Math.min(100, Number(v) || 8))); }
  previewMatches() { this.sf.resolveSelector(this.value()).subscribe({ next: p => this.matches.set(p), error: err => this.dialogUtils.openErrorMessageFromError(err) }); }
  pick(name: string, label: string) { return this.inputField(name).set(this.inputKeys.label, label).set(this.inputKeys.styleWidth, '100%').set(this.inputKeys.showSizeInput, false).set(this.inputKeys.showSearchOption, true).set(this.inputKeys.uniqueValue, true).set(this.inputKeys.disable, this.disabled()); }
}
