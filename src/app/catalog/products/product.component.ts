import { Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RouteUtils } from '../../../lib/util/Route.utils';
import { NgComponentModule } from "../../../lib/module/ng-component.module";
import { MatOption } from '../../../lib/model/mat.model';
import { ViesRestApi } from '../../../lib/abtract/ViesRestApi';
import { DataUtils } from '../../../lib/util/Data.utils';
import { APP_ROUTES } from '../../app.routes';
import { Category, Product, ProductMedia, ProductStatus, ProductVariant, Tag } from '../../shared/model/product.model';
import { AttributeDefinition, AttributeValue, ProductAttribute } from '../../shared/model/attribute.model';
import { ProductService } from '../../shared/service/product/product.service';
import { CategoryService } from '../../shared/service/category/category.service';
import { TagService } from '../../shared/service/tag/tag.service';
import { AttributeDefinitionService } from '../../shared/service/attribute-definition/attribute-definition.service';
import { CategoryQuickAddDialog } from '../categories/category/category-quick-add-dialog/category-quick-add-dialog.component';
import { TagQuickAddDialog } from '../tags/tag/tag-quick-add-dialog/tag-quick-add-dialog.component';
import { AttributeValueFieldComponent } from '../../shared/component/attribute-value-field/attribute-value-field.component';
import { ProductMediaGalleryComponent } from '../../shared/component/product-media/media-gallery/media-gallery.component';
import { VariantGeneratorDialog, VariantGeneratorDialogData } from './variant-generator-dialog/variant-generator-dialog.component';
import { GenerateVariantsResponse } from '../../shared/model/product.model';
import { SnackBarUtils } from '../../../lib/util/SnackBar.utils';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
  imports: [NgComponentModule, AttributeValueFieldComponent, ProductMediaGalleryComponent]
})
export class ProductComponent extends ViesRestApi<Product, ProductService> implements OnInit {

  service = inject(ProductService);
  categoryService = inject(CategoryService);
  tagService = inject(TagService);
  attributeDefinitionService = inject(AttributeDefinitionService);

  validForm = signal<boolean>(false);

  // Reference to the media gallery inside the Media tab. Optional because the
  // gallery only renders when the product is saved (isNewProduct() gates it),
  // and even after that, its lifecycle is coupled to the tab-group's
  // preserveContent flag. save() guards on presence before flushing.
  gallery = viewChild(ProductMediaGalleryComponent);

  // Used as the `<app-mat-table>` blank object for column inference on the
  // Variants tab.
  readonly blankProductVariant = new ProductVariant();

  // Convenience: whether this is a brand-new product (no id yet). The
  // Attributes, Variants, and Media tabs are gated behind a save because their
  // rows reference the parent product's UUID once persisted — trying to add
  // them into an unsaved graph works locally but creates a confusing UX where
  // "Save" acts as an implicit "commit these attributes too" without the admin
  // realizing. Nudge admins to save Basics first.
  isNewProduct = computed<boolean>(() => !this.id());

  // ---- Global pools --------------------------------------------------------
  allCategories = signal<Category[]>([]);
  allTags = signal<Tag[]>([]);
  allAttributeDefinitions = signal<AttributeDefinition[]>([]);

  // ---- Category picker -----------------------------------------------------
  categoryOptions = computed<MatOption<Category>[]>(() =>
    this.allCategories().map(c => ({
      value: c,
      valueLabel: this.categoryPath(c)
    }))
  );

  // Backend requires an embedded category with a real id — POSTing {id:""}
  // 500s. Save is gated on this alongside validForm().
  hasCategory = computed<boolean>(() => !!this.value()?.category?.id);

  selectedCategory = computed<Category | null>(() => {
    const catId = this.value()?.category?.id;
    if (!catId) return null;
    return this.allCategories().find(c => c.id === catId) ?? null;
  });

  // ---- Tags picker (multi-select) -----------------------------------------
  tagOptions = computed<MatOption<Tag>[]>(() =>
    this.allTags().map(t => ({
      value: t,
      valueLabel: t.name || '(unnamed)'
    }))
  );

  // ---- Attribute definitions -----------------------------------------------
  // Options for the product-level Attributes tab picker. The backend no longer
  // splits definitions into product-level vs variant-level, so any definition
  // can be attached; the same pool serves the variant editor page too.
  productLevelDefinitionOptions = computed<MatOption<AttributeDefinition>[]>(() =>
    this.allAttributeDefinitions().map(d => ({
      value: d,
      valueLabel: d.displayName || d.name
    }))
  );

  // ---- Lifecycle -----------------------------------------------------------

  override getRouteId() {
    const id = RouteUtils.getPathVariable('products');
    return id === 'new' ? null : id;
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.refreshCategories();
    this.refreshTags();
    this.refreshAttributeDefinitions();
  }

  private refreshCategories() {
    this.categoryService.getAll().subscribe({
      next: res => this.allCategories.set(res),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  private refreshTags() {
    this.tagService.getAll().subscribe({
      next: res => this.allTags.set(res),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  private refreshAttributeDefinitions() {
    this.attributeDefinitionService.getAll().subscribe({
      next: res => this.allAttributeDefinitions.set(res),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  // ---- Basics tab handlers -------------------------------------------------

  onMainFormChange(v: Product) {
    // Spread for signal-firing (same workaround as other dynamic-form callers).
    this.value.set({ ...v });
  }

  onCategoryChange(cat: Category | string | null | undefined) {
    // Without manuallyEmitValue the autocomplete emits the raw text on every
    // keystroke. Partial text is not a selection — ignore it; an emitted empty
    // string (clear icon / requireSelection reset) means "clear the category".
    if (typeof cat === 'string') {
      if (cat !== '') return;
      cat = null;
    }
    const p = this.value();
    if (!p) return;
    p.category = cat ?? DataUtils.purgeValue(new Category());
    this.value.set({ ...p });
  }

  onTagsChange(tags: Tag[]) {
    const p = this.value();
    if (!p) return;
    p.tags = tags ?? [];
    this.value.set({ ...p });
  }

  openCreateCategoryDialog() {
    this.dialogUtils.matDialog
      .open(CategoryQuickAddDialog, { width: '480px' })
      .afterClosed()
      .subscribe((draft: Category | undefined) => {
        if (!draft) return;
        this.categoryService.post(draft).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
          next: saved => {
            this.allCategories.update(all => [...all, saved]);
            const p = this.value();
            if (p) {
              p.category = saved;
              this.value.set({ ...p });
            }
          },
          error: err => this.dialogUtils.openErrorMessageFromError(err)
        });
      });
  }

  // Same pattern as openCreateCategoryDialog but for Tag: popup returns a
  // drafted Tag → POST it → append to the global tag pool → append to the
  // product's tags selection (Product owns tags via M2M, so we set the join
  // by adding the saved Tag to `product.tags`).
  openCreateTagDialog() {
    this.dialogUtils.matDialog
      .open(TagQuickAddDialog, { width: '480px' })
      .afterClosed()
      .subscribe((draft: Tag | undefined) => {
        if (!draft) return;
        this.tagService.post(draft).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
          next: saved => {
            this.allTags.update(all => [...all, saved]);
            const p = this.value();
            if (p) {
              if (!p.tags) p.tags = [];
              p.tags.push(saved);
              this.value.set({ ...p });
            }
          },
          error: err => this.dialogUtils.openErrorMessageFromError(err)
        });
      });
  }

  // Render a category with its ancestry path for clearer disambiguation in the
  // picker (e.g. "Apparel > Tops > T-Shirts"). Falls back to just the name when
  // ancestors are missing.
  private categoryPath(cat: Category): string {
    const byId = new Map(this.allCategories().map(c => [c.id, c]));
    const parts: string[] = [];
    let current: Category | undefined = cat;
    const seen = new Set<string>();
    while (current && !seen.has(current.id)) {
      parts.unshift(current.name || '(unnamed)');
      seen.add(current.id);
      current = current.parentCategoryId ? byId.get(current.parentCategoryId) : undefined;
    }
    return parts.join(' > ');
  }

  // ---- Product-level attributes tab handlers --------------------------------

  addProductAttribute(definition?: AttributeDefinition) {
    const p = this.value();
    if (!p) return;
    const attr = DataUtils.purgeValue(new ProductAttribute());
    attr.attributeDefinition = definition ?? DataUtils.purgeValue(new AttributeDefinition());
    attr.attributeValue = DataUtils.purgeValue(new AttributeValue());
    if (!p.attributes) p.attributes = [];
    p.attributes.push(attr);
    this.value.set({ ...p });
  }

  removeProductAttribute(index: number) {
    const p = this.value();
    if (!p?.attributes) return;
    p.attributes.splice(index, 1);
    this.value.set({ ...p });
  }

  onProductAttributeDefinitionChange(index: number, def: AttributeDefinition) {
    const p = this.value();
    if (!p?.attributes) return;
    p.attributes[index].attributeDefinition = def;
    // Reset the value slot when definition changes to avoid stale slot leakage.
    p.attributes[index].attributeValue = DataUtils.purgeValue(new AttributeValue());
    this.value.set({ ...p });
  }

  onProductAttributeValueChange(index: number, val: AttributeValue) {
    const p = this.value();
    if (!p?.attributes) return;
    p.attributes[index].attributeValue = val;
    this.value.set({ ...p });
  }

  // Route to the attribute-definition creator with a `returnToProduct` query
  // param — the AttributeDefinitionComponent reads that and shows a
  // "Back to product" button once the admin is done (see its ngOnInit).
  createNewAttributeDefinition() {
    const productId = this.id();
    if (!productId) return;
    this.router.navigate(
      [APP_ROUTES.schemaAttributeDefinitionNew],
      { queryParams: { returnToProduct: productId } }
    );
  }

  // Value binding helper for the autocomplete definition picker — passes the
  // whole AttributeDefinition (or null when the row hasn't picked one yet) so
  // the picker's displayFn falls through to the options lookup and shows the
  // human name. A blank `new AttributeDefinition()` has `id: ''` — we treat
  // that as "unset".
  attributeDefinitionValueFor(attr: ProductAttribute): AttributeDefinition | null {
    return attr.attributeDefinition?.id ? attr.attributeDefinition : null;
  }

  // ---- Variants (navigation-based editing) ---------------------------------
  //
  // Variants are edited on their own dedicated page (ProductVariantComponent)
  // rather than inline. The Variants tab here is a simple table of the product's
  // variants; Add and click-to-edit navigate to `/catalog/products/:pid/variants/…`.
  // This keeps the product editor small enough to reason about and matches how
  // AttributeDefinitionOption's "surgical edits" flow works.
  //
  // Navigation is guarded on unsaved product changes — if the admin has
  // pending edits on the product form, opening a variant editor would create
  // divergent parallel state. Force save-or-revert first (checked in the
  // handlers below).

  private guardUnsavedChanges(): boolean {
    if (this._value.isValueChange()) {
      this.dialogUtils.openErrorMessage(
        'Unsaved product changes',
        'Save or revert your product changes before adding or editing a variant.'
      );
      return false;
    }
    return true;
  }

  navigateToNewVariant() {
    if (!this.guardUnsavedChanges()) return;
    const pid = this.id();
    if (!pid) return;
    this.router.navigate([APP_ROUTES.catalogProductVariantNew(pid)]);
  }

  // Cartesian generator — server-side (POST /products/{id}/generate-variants).
  // Guarded on unsaved changes like the other variant actions: the endpoint
  // saves through the product graph, so pending local edits would be lost.
  openVariantGeneratorDialog() {
    if (!this.guardUnsavedChanges()) return;
    const pid = this.id();
    if (!pid) return;
    this.dialogUtils.matDialog
      .open(VariantGeneratorDialog, {
        width: '560px',
        data: {
          productId: pid,
          baseSku: this.value()?.baseSku ?? '',
          definitions: this.allAttributeDefinitions()
        } satisfies VariantGeneratorDialogData
      })
      .afterClosed()
      .subscribe((res: GenerateVariantsResponse | undefined) => {
        if (!res) return;
        // The response carries the authoritative updated product graph —
        // swap it in as the new tracking baseline (same as a save would).
        this._value.set(res.product);
        SnackBarUtils.openSnackBar(
          this.rxjsUtils.snackBar,
          `Generated ${res.created} variant(s)` + (res.skipped ? `, skipped ${res.skipped} existing` : ''),
          'Dismiss', 8000
        );
      });
  }

  navigateToEditVariant(variant: ProductVariant) {
    if (!this.guardUnsavedChanges()) return;
    const pid = this.id();
    if (!pid || !variant.id) return;
    this.router.navigate([APP_ROUTES.catalogProductVariant(pid, variant.id)]);
  }

  // ---- Media tab handler ---------------------------------------------------
  //
  // The gallery owns the entire media collection lifecycle (add / replace /
  // reorder / delete / isPrimary uniqueness / dialog wiring). We just receive
  // the updated array and spread it onto the product signal so downstream
  // dirty-tracking and save() see the change.
  onMediasChange(medias: ProductMedia[]) {
    const p = this.value();
    if (!p) return;
    p.medias = medias;
    this.value.set({ ...p });
  }

  // ---- Save / delete overrides ---------------------------------------------

  // Three-phase save so we can bracket the ObjectStorageService side effects
  // around the product PUT:
  //
  //   1. Flush pending uploads through the gallery — POST every staged blob to
  //      object storage, get back real vies URLs + storage ids, splat them
  //      onto ProductMedia entries. Failures abort save so nothing half-commits.
  //   2. PUT (or POST) the product via ProductService, awaited directly rather
  //      than via super.save(). That gives us a clean await-point for step 3.
  //   3. If the product save succeeded AND the gallery has memorized any
  //      storage ids from Remove/Replace, purge those files via
  //      ObjectStorageService. The db rows referencing them are now gone;
  //      leaving the files behind would just create orphans in storage.
  //
  // If step 2 fails, step 3 is skipped — the media rows still reference those
  // files and we must not delete them.
  override async save() {
    const gallery = this.gallery();

    // Step 1
    if (gallery && gallery.hasPendingUploads()) {
      try {
        const finalized = await gallery.flushPendingUploads();
        const p = this.value();
        if (p) {
          p.medias = finalized;
          this.value.set({ ...p });
        }
      } catch (err) {
        this.dialogUtils.openErrorMessageFromError(err);
        return;
      }
    }

    // Step 2 — inline PUT/POST so we can await it (super.save is
    // subscribe-based). Same shape as ViesRestApi.save(); we just need to
    // hand the result back to _value AND get a completion signal for step 3.
    const draft = this._value.value();
    if (!draft) return;

    // Read-only server-computed fields must not be echoed back in the
    // payload. `effectivePrice` lives on each variant; strip it from every
    // one. Backend ignores it either way, but this keeps the wire clean and
    // makes the read-only contract explicit.
    if (Array.isArray(draft.variants)) {
      for (const v of draft.variants) {
        delete (v as ProductVariant).effectivePrice;
      }
    }

    try {
      const wasCreate = !this.id();
      const saved = !wasCreate
        ? await firstValueFrom(
            this.service.put(this.id(), draft).pipe(this.rxjsUtils.waitLoadingDialog())
          )
        : await firstValueFrom(
            this.service.post(draft).pipe(this.rxjsUtils.waitLoadingDialog())
          );
      this._value.set(saved);

      // Step 3
      if (gallery && gallery.hasPendingStorageDeletes()) {
        await gallery.flushPendingStorageDeletes();
      }

      // Step 4 — after a create, leave /new for the real edit URL so
      // refresh/bookmark/back work (FE-10) and the variant/media tabs unlock
      // against the persisted id.
      if (wasCreate && saved?.id) {
        this.router.navigate([APP_ROUTES.catalogProduct(saved.id)]);
      }
    } catch (err) {
      this.dialogUtils.openErrorMessageFromError(err);
    }
  }

  // Cascade-delete with counts for variants, attributes, and media so the admin
  // understands the blast radius before confirming (intent § 7.6).
  override async remove() {
    if (!this.id()) return;
    const p = this.value();
    const confirmed = await this.dialogUtils.openCascadeDeleteConfirm('product', [
      { label: 'variant',    count: p?.variants?.length   ?? 0 },
      { label: 'attribute',  count: p?.attributes?.length ?? 0 },
      { label: 'media item', count: p?.medias?.length     ?? 0 }
    ]);
    if (!confirmed) return;

    this.service.delete(this.id()).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: () => this.router.navigate([APP_ROUTES.catalogProductList]),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
}
