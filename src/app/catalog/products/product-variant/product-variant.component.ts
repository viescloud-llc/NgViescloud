import { Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom } from 'rxjs';
import { RouteUtils } from '../../../../lib/util/Route.utils';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { MatOption } from '../../../../lib/model/mat.model';
import { ViesRestApi } from '../../../../lib/abtract/ViesRestApi';
import { DataUtils } from '../../../../lib/util/Data.utils';
import { APP_ROUTES } from '../../../app.routes';
import { Product, ProductMedia, ProductVariant, VariantPriceMode } from '../../../shared/model/product.model';
import { AttributeDefinition, AttributeValue, ProductVariantAttribute } from '../../../shared/model/attribute.model';
import { ProductService } from '../../../shared/service/product/product.service';
import { ProductVariantService } from '../../../shared/service/product-variant/product-variant.service';
import { ProductMediaService } from '../../../shared/service/product-media/product-media.service';
import { AttributeDefinitionService } from '../../../shared/service/attribute-definition/attribute-definition.service';
import { AttributeValueFieldComponent } from '../../../shared/component/attribute-value-field/attribute-value-field.component';
import { ProductMediaGalleryComponent } from '../../../shared/component/product-media/media-gallery/media-gallery.component';

// Standalone editor for a single ProductVariant. Reached ONLY via the Variants
// tab on the ProductComponent (either "Add variant" or clicking a row) — this
// is intentional per the design: variants are treated like mini-products and
// edited in their own dedicated page rather than inline on the parent product.
//
// URL shape: /catalog/products/:productId/variants/{new,:variantId}
// - productId  — parent product's UUID, read from route params; drives the
//                POST body's product back-reference and the "Back to product"
//                button target.
// - variantId  — 'new' for create mode, UUID for edit; standard Vies pattern.
@Component({
  selector: 'app-product-variant',
  templateUrl: './product-variant.component.html',
  styleUrls: ['./product-variant.component.scss'],
  imports: [
    NgComponentModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    AttributeValueFieldComponent,
    ProductMediaGalleryComponent
  ]
})
export class ProductVariantComponent extends ViesRestApi<ProductVariant, ProductVariantService> implements OnInit {

  service = inject(ProductVariantService);
  productService = inject(ProductService);
  attributeDefinitionService = inject(AttributeDefinitionService);
  activatedRoute = inject(ActivatedRoute);
  private location = inject(Location);

  validForm = signal<boolean>(false);

  // Reference to the media gallery. Save flushes any deferred blob uploads
  // through it before committing the variant. See the save() override below.
  gallery = viewChild(ProductMediaGalleryComponent);

  // Parent product id, captured on init. Drives the POST body's product
  // reference AND the "Back to product" navigation.
  productId = signal<string>('');

  // Global pool of attribute definitions (same source as ProductComponent).
  // The backend no longer separates product-level vs variant-level, so any
  // definition can be attached as a variant attribute.
  allAttributeDefinitions = signal<AttributeDefinition[]>([]);

  // Expose the enum to the template.
  readonly VariantPriceMode = VariantPriceMode;
  readonly priceModeOptions: { value: VariantPriceMode; label: string }[] = [
    { value: VariantPriceMode.NORMAL,             label: 'Fixed price' },
    { value: VariantPriceMode.FLAT_ADJUSTMENT,    label: 'Adjust base by amount' },
    { value: VariantPriceMode.PERCENT_ADJUSTMENT, label: 'Adjust base by percent' }
  ];

  // Parent product — fetched on init. Feeds the "Editing a variant of X"
  // banner (variants carry no product back-ref on the wire anymore) and the
  // client-side effectivePrice preview (basePrice) under adjustment modes.
  // If the fetch fails, the preview falls back per the spec:
  //   • basePrice missing → effectivePrice = raw price
  //   • adjustment mode + null price → effectivePrice = basePrice (delta 0)
  parentProduct = signal<Product | null>(null);

  parentBasePrice = computed<string | undefined>(() => {
    const base = this.parentProduct()?.basePrice;
    return base === undefined || base === null ? undefined : String(base);
  });

  // Adapt the price input's label to the current mode. Keeps a single input
  // field but shifts its meaning between "the price" and "adjustment".
  priceLabel = computed<string>(() => {
    switch (this.value()?.priceMode ?? VariantPriceMode.NORMAL) {
      case VariantPriceMode.NORMAL:             return 'Price';
      case VariantPriceMode.FLAT_ADJUSTMENT:    return 'Price adjustment';
      case VariantPriceMode.PERCENT_ADJUSTMENT: return 'Percent adjustment';
    }
  });

  priceHint = computed<string>(() => {
    const mode = this.value()?.priceMode ?? VariantPriceMode.NORMAL;
    return mode === VariantPriceMode.NORMAL
      ? ''
      : 'Positive = markup, negative = discount';
  });

  priceSuffix = computed<string>(() =>
    this.value()?.priceMode === VariantPriceMode.PERCENT_ADJUSTMENT ? '%' : ''
  );

  // Client-side echo of what the server will resolve. Uses parentBasePrice
  // (fetched separately) + local price/priceMode. Not authoritative — the
  // server's effectivePrice on the response is. Useful for catching admin
  // mistakes (typing a raw price when they meant a % adjustment, etc.).
  effectivePricePreview = computed<string>(() => {
    const v = this.value();
    return this.computeEffective(this.parentBasePrice(), v?.priceMode, v?.price);
  });

  attributeDefinitionOptions = computed<MatOption<AttributeDefinition>[]>(() =>
    this.allAttributeDefinitions().map(d => ({
      value: d,
      valueLabel: d.displayName || d.name
    }))
  );

  override getRouteId() {
    const id = RouteUtils.getPathVariable('variants');
    return id === 'new' ? null : id;
  }

  override ngOnInit(): void {
    super.ngOnInit();

    // Capture the parent product id from the URL. Try the ActivatedRoute
    // param map first (proper Angular API); fall back to URL string parsing
    // in case route data isn't populated (SSR quirks etc.).
    const pid = this.activatedRoute.snapshot.paramMap.get('productId')
             ?? RouteUtils.getPathVariable('products');
    if (pid && pid !== 'new') this.productId.set(pid);

    this.refreshAttributeDefinitions();
    this.refreshParentProduct();
  }

  // Fetch the parent product — feeds the banner name + the effectivePrice
  // preview. Failures are swallowed: the banner falls back to a generic
  // label and the preview to the raw price (per spec).
  private refreshParentProduct() {
    const pid = this.productId();
    if (!pid) return;
    this.productService.get(pid).subscribe({
      next: p => this.parentProduct.set(p),
      error: () => { /* banner/preview fall back; not a save-blocker */ }
    });
  }

  private refreshAttributeDefinitions() {
    this.attributeDefinitionService.getAll().subscribe({
      next: res => this.allAttributeDefinitions.set(res),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  // Navigate back to the parent product editor.
  backToProduct() {
    const pid = this.productId();
    if (!pid) return;
    this.router.navigate([APP_ROUTES.catalogProduct(pid)]);
  }

  // Deep-clone the current variant into a fresh in-memory record. NO backend
  // call — the clone lives only in the current editor state; nothing gets
  // persisted until the admin hits Save (which then routes through the parent
  // Product PUT, same as any new variant).
  //
  // Cleared on the clone:
  //   • id (top-level and on every owned child — attributeValues, medias)
  //   • createdAt / updatedAt (backend-managed; a fresh record shouldn't
  //     carry the source's timestamps)
  //   • product back-ref (avoids recursion when embedded into parent.variants
  //     on save; productId signal already tracks the parent)
  //
  // Preserved intentionally:
  //   • sku, variantName, price, stock, status — the whole point of Clone is
  //     that these are almost right and just need a tweak
  //   • medias' objectStorageDataId + url — cloned entries reference the same
  //     backend storage objects (no re-upload; backend just adds new join rows)
  //
  // After cloning, _value.set(cloned) resets dirty tracking so the clone is
  // the new baseline. The admin's first tweak (typically a new SKU, since
  // duplicate SKUs will be rejected by the backend) flips Save on. The URL is
  // cosmetically swapped to /variants/new so the location bar matches the
  // "unsaved draft" state — no route navigation, so this component instance
  // and its resolved-media cache survive.
  clone() {
    const v = this._value.value();
    if (!v || !this.id()) return;

    const cloned = structuredClone(v);
    cloned.id = '';
    cloned.attributeValues?.forEach(a => { a.id = ''; });
    cloned.medias?.forEach(m => { m.id = ''; });
    cloned.createdAt = undefined;
    cloned.updatedAt = undefined;

    this._value.set(cloned);

    const pid = this.productId();
    if (pid) {
      this.location.replaceState('/' + APP_ROUTES.catalogProductVariantNew(pid));
    }
  }

  // ---- Basics form ---------------------------------------------------------

  // Same signal-mutation workaround as elsewhere: the dynamic form mutates the
  // bound object in place and re-emits the same reference; spread to force a
  // new top-level ref so downstream computeds re-evaluate. Also PRESERVES the
  // hidden `attributeValues`, `medias`, and pricing fields — the dynamic form
  // doesn't render them, and a naive assignment would wipe them.
  onMainFormChange(v: ProductVariant) {
    const current = this.value();
    v.attributeValues = current?.attributeValues ?? [];
    v.medias = current?.medias ?? [];
    v.price = current?.price;
    v.priceMode = current?.priceMode ?? VariantPriceMode.NORMAL;
    v.effectivePrice = current?.effectivePrice;
    this.value.set({ ...v });
  }

  // ---- Pricing (custom section outside the dynamic form) -------------------

  onPriceChange(next: string) {
    const v = this.value();
    if (!v) return;
    v.price = next ?? '';
    this.value.set({ ...v });
  }

  onPriceModeChange(mode: VariantPriceMode) {
    const v = this.value();
    if (!v) return;
    v.priceMode = mode;
    this.value.set({ ...v });
  }

  // Client-side echo of the server's price resolution. Not authoritative —
  // meant as a preview so admins spot mistakes (e.g. typing a raw price when
  // they meant a %). Spec edge cases:
  //   • basePrice missing → fallback to raw price (adjustment modes still
  //     produce raw price, since we can't compute without the base)
  //   • adjustment mode + null/empty price → treat delta as 0 (effective =
  //     basePrice)
  //   • unparseable inputs → '—' so it's obvious something is off
  //
  // Percent mode uses the same formula as the backend spec: base × (1 + p/100),
  // rounded HALF_UP to 2dp. `Math.round(x * 100) / 100` mirrors HALF_UP for
  // positive values and is close enough for a preview — the server does the
  // authoritative BigDecimal math.
  private computeEffective(
    basePrice: string | undefined,
    mode: VariantPriceMode | undefined,
    price: string | undefined
  ): string {
    const rawPrice = price === undefined || price === null || price === '' ? null : Number(price);
    const base = basePrice === undefined || basePrice === null || basePrice === '' ? null : Number(basePrice);
    const m = mode ?? VariantPriceMode.NORMAL;

    // Base is unknown — adjustment modes have no anchor. Fall back to raw.
    if (base === null || isNaN(base)) {
      if (rawPrice === null || isNaN(rawPrice)) return '—';
      return rawPrice.toFixed(2);
    }

    // Adjustment modes: null/empty price → delta 0 → effective = base.
    const p = rawPrice === null || isNaN(rawPrice) ? 0 : rawPrice;

    switch (m) {
      case VariantPriceMode.NORMAL:
        return rawPrice === null || isNaN(rawPrice) ? '—' : rawPrice.toFixed(2);
      case VariantPriceMode.FLAT_ADJUSTMENT:
        return (base + p).toFixed(2);
      case VariantPriceMode.PERCENT_ADJUSTMENT:
        return (Math.round(base * (1 + p / 100) * 100) / 100).toFixed(2);
    }
  }

  // ---- Attribute rows ------------------------------------------------------

  addVariantAttribute() {
    const v = this.value();
    if (!v) return;
    const attr = DataUtils.purgeValue(new ProductVariantAttribute());
    attr.attributeDefinition = DataUtils.purgeValue(new AttributeDefinition());
    attr.attributeValue = DataUtils.purgeValue(new AttributeValue());
    if (!v.attributeValues) v.attributeValues = [];
    v.attributeValues.push(attr);
    this.value.set({ ...v });
  }

  removeVariantAttribute(index: number) {
    const v = this.value();
    if (!v?.attributeValues) return;
    v.attributeValues.splice(index, 1);
    this.value.set({ ...v });
  }

  onAttributeDefinitionChange(index: number, def: AttributeDefinition | null) {
    const v = this.value();
    if (!v?.attributeValues) return;
    v.attributeValues[index].attributeDefinition = def ?? DataUtils.purgeValue(new AttributeDefinition());
    // Reset the value slot on type/definition change so stale slots don't leak.
    v.attributeValues[index].attributeValue = DataUtils.purgeValue(new AttributeValue());
    this.value.set({ ...v });
  }

  onAttributeValueChange(index: number, val: AttributeValue) {
    const v = this.value();
    if (!v?.attributeValues) return;
    v.attributeValues[index].attributeValue = val;
    this.value.set({ ...v });
  }

  // Value binding helper (mirrors ProductComponent's) — passes the whole
  // definition when set, null when unset, so the picker's displayFn resolves
  // to the human name.
  attributeDefinitionValueFor(attr: ProductVariantAttribute): AttributeDefinition | null {
    return attr.attributeDefinition?.id ? attr.attributeDefinition : null;
  }

  // ---- Media gallery -------------------------------------------------------
  //
  // Same setup as ProductComponent's Media tab: the gallery owns the add /
  // replace / reorder / delete flow (and the isPrimary uniqueness rule), we
  // just receive the updated array.
  onMediasChange(medias: ProductMedia[]) {
    const v = this.value();
    if (!v) return;
    v.medias = medias;
    this.value.set({ ...v });
  }

  // ---- Save / delete overrides ---------------------------------------------

  // Variant saves route through the PARENT Product's PUT rather than a direct
  // POST/PUT on ProductVariantService. Rationale: the backend cascades child
  // entities under a Product write (intent § 5.1), so sending the whole
  // product graph is authoritative — no risk of a partial write where the
  // variant lands but the product's transient state ("variants count" etc.)
  // drifts, and no ambiguity about which parent the new variant belongs to.
  //
  // Flow:
  //   1. Flush any deferred media uploads through the gallery so the variant's
  //      medias have real vies URLs + storage ids (not blob URLs).
  //   2. Load the parent product fresh — we want the CURRENT server state to
  //      merge into, not whatever stale copy we might have had.
  //   3. Splice our draft variant into product.variants (replace by id for
  //      edits; append for new).
  //   4. PUT the product via ProductService.
  //   5. Find our variant in the response (by matching id for edits; by
  //      "new id not in the pre-save snapshot" for creates) and re-hydrate
  //      _value with it so revert/save-tracking are consistent.
  //   6. For creates, navigate to the newly-minted variant's edit URL.
  //
  // Delete still goes through ProductVariantService directly — the user's
  // scope was saving only, and the direct DELETE endpoint is fine (backend
  // cascades cleanly). See remove() below.
  override async save() {
    // (1) flush pending media uploads
    const gallery = this.gallery();
    if (gallery && gallery.hasPendingUploads()) {
      try {
        const finalized = await gallery.flushPendingUploads();
        const v = this._value.value();
        if (v) {
          v.medias = finalized;
          this.value.set({ ...v });
        }
      } catch (err) {
        this.dialogUtils.openErrorMessageFromError(err);
        return;
      }
    }

    const draft = this._value.value();
    const pid = this.productId();
    if (!draft || !pid) return;
    const existingId = this.id();

    try {
      // (2) load the parent product fresh
      const parent = await firstValueFrom(
        this.productService.get(pid).pipe(this.rxjsUtils.waitLoadingDialog())
      );
      if (!parent) return;
      if (!Array.isArray(parent.variants)) parent.variants = [];

      // Snapshot pre-save variant ids so we can identify the newly-created
      // row in the response. Set-diff is more robust than "assume last
      // element" — the backend may reorder.
      const preSaveIds = new Set(
        parent.variants.map(v => v.id).filter((id): id is string => !!id)
      );

      // Drop `effectivePrice` (read-only / server-computed; the backend
      // ignores it if sent, but stripping keeps payloads clean) and coerce an
      // empty-string price to undefined — price is BigDecimal on the wire and
      // Jackson rejects "" (adjustment modes treat missing price as delta 0).
      const cleaned = structuredClone(draft) as ProductVariant;
      delete cleaned.effectivePrice;
      if (cleaned.price === '') cleaned.price = undefined;

      // (3) splice into parent.variants
      if (existingId) {
        const idx = parent.variants.findIndex(v => v.id === existingId);
        if (idx === -1) {
          // Server-side state and local state diverged (rare — perhaps another
          // admin deleted this variant). Append so the admin's work isn't
          // lost; treat it effectively as a re-create.
          parent.variants.push(cleaned);
        } else {
          parent.variants[idx] = cleaned;
        }
      } else {
        parent.variants.push(cleaned);
      }

      // (4) PUT the product
      const saved = await firstValueFrom(
        this.productService.put(pid, parent).pipe(this.rxjsUtils.waitLoadingDialog())
      );

      // (5) locate our variant in the response
      const savedVariants = saved?.variants ?? [];
      let savedVariant: ProductVariant | undefined;
      if (existingId) {
        savedVariant = savedVariants.find(v => v.id === existingId);
      } else {
        savedVariant = savedVariants.find(v => v.id && !preSaveIds.has(v.id));
      }
      if (!savedVariant) {
        // Response didn't include our variant — shouldn't happen, but bail
        // cleanly rather than corrupting local state.
        this.dialogUtils.openErrorMessage(
          'Save succeeded, but couldn\'t locate the variant',
          'The parent product was updated, but the response didn\'t include the variant we saved. Reload the page.'
        );
        return;
      }
      this._value.set(savedVariant);

      // (6) product PUT succeeded → the media db rows are up to date, so any
      // storage files the admin marked for deletion (via Remove or Replace on
      // a storage-backed media) can now be safely purged from object storage.
      // Silent failures on individual deletes; the save itself already
      // succeeded from the admin's perspective.
      if (gallery && gallery.hasPendingStorageDeletes()) {
        await gallery.flushPendingStorageDeletes();
      }

      // (7) navigate on create so the URL matches the new id
      if (!existingId && savedVariant.id) {
        this.router.navigate([APP_ROUTES.catalogProductVariant(pid, savedVariant.id)]);
      }
    } catch (err) {
      this.dialogUtils.openErrorMessageFromError(err);
    }
  }

  // Cascade-delete confirm with attribute + media counts. On delete, navigate
  // back to the parent product editor so the admin lands somewhere useful.
  override async remove() {
    if (!this.id()) return;
    const v = this.value();
    const confirmed = await this.dialogUtils.openCascadeDeleteConfirm('variant', [
      { label: 'attribute',  count: v?.attributeValues?.length ?? 0 },
      { label: 'media item', count: v?.medias?.length            ?? 0 }
    ]);
    if (!confirmed) return;

    this.service.delete(this.id()).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: () => this.backToProduct(),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
}
