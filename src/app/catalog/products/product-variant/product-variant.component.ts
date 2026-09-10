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
import { DigitalAsset, Product, ProductMedia, ProductVariant, VariantFulfillmentType, VariantPriceMode } from '../../../shared/model/product.model';
import { AttributeDefinition, AttributeValue, ProductVariantAttribute } from '../../../shared/model/attribute.model';
import { ProductService } from '../../../shared/service/product/product.service';
import { ProductVariantService } from '../../../shared/service/product-variant/product-variant.service';
import { ProductMediaService } from '../../../shared/service/product-media/product-media.service';
import { AttributeDefinitionService } from '../../../shared/service/attribute-definition/attribute-definition.service';
import { AttributeValueFieldComponent } from '../../../shared/component/attribute-value-field/attribute-value-field.component';
import { ProductMediaGalleryComponent } from '../../../shared/component/product-media/media-gallery/media-gallery.component';
import { QuickStockDialog, QuickStockDialogData } from '../../../shared/component/quick-stock-dialog/quick-stock-dialog.component';
import { StockMovement } from '../../../shared/model/commerce.model';
import { ProductVariantScanCode, SCAN_CODE_SYMBOLOGY_LABELS, ScanCodeSymbology } from '../../../shared/model/scan-code.model';
import { ScanCodeService } from '../../../shared/service/scan-code/scan-code.service';
import { LabelFormat, ScanLabelUtil } from '../../../shared/util/scan-label.util';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ViesService } from '../../../../lib/service/rest.service';
import { SnackBarUtils } from '../../../../lib/util/SnackBar.utils';
import { DigitalAssetService } from '../../../shared/service/digital-asset/digital-asset.service';
import { UtilsService } from '../../../../lib/service/utils.service';
import { FileUtils } from '../../../../lib/util/File.utils';

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

  // Expose the enums to the template.
  readonly VariantPriceMode = VariantPriceMode;
  readonly VariantFulfillmentType = VariantFulfillmentType;

  // ---- Scan codes (barcode / QR) --------------------------------------------
  //
  // MAIN code = the variant id (UUIDv7: unique, immutable, generated on create),
  // rendered as a QR by default or a (long) Code 128 stripe. ALIASES are any
  // outside codes (supplier UPC, legacy labels…) managed through their own
  // endpoint; they may repeat across variants but not on one variant.
  private scanCodeService = inject(ScanCodeService);
  private sanitizer = inject(DomSanitizer);
  readonly symbologyOptions = (Object.values(ScanCodeSymbology) as ScanCodeSymbology[]).map(s => ({ value: s, label: SCAN_CODE_SYMBOLOGY_LABELS[s] }));
  readonly symbologyLabels = SCAN_CODE_SYMBOLOGY_LABELS;
  mainCodeFormat = signal<LabelFormat>('QR');
  mainQrDataUrl = signal<string>('');
  mainCode128Svg = signal<SafeHtml | null>(null);
  labelCopies = signal<number>(1);
  scanCodes = signal<ProductVariantScanCode[]>([]);
  newAliasValue = signal<string>('');
  newAliasSymbology = signal<ScanCodeSymbology>(ScanCodeSymbology.OTHER);
  newAliasLabel = signal<string>('');
  canAddAlias = computed<boolean>(() => !!this.id() && this.newAliasValue().trim().length > 0);

  private renderMainCode() {
    const id = this.id();
    if (!id || ViesService.isNotCSR()) { this.mainQrDataUrl.set(''); this.mainCode128Svg.set(null); return; }
    ScanLabelUtil.qrDataUrl(id, 180).then(url => this.mainQrDataUrl.set(url)).catch(() => this.mainQrDataUrl.set(''));
    try {
      this.mainCode128Svg.set(this.sanitizer.bypassSecurityTrustHtml(ScanLabelUtil.code128Svg(id, { height: 40, width: 1 })));
    } catch { this.mainCode128Svg.set(null); }
  }

  loadScanCodes() {
    const id = this.id();
    if (!id) { this.scanCodes.set([]); return; }
    this.scanCodeService.list(id).subscribe({ next: res => this.scanCodes.set(res ?? []), error: () => this.scanCodes.set([]) });
  }

  copyMainCode() {
    const id = this.id();
    if (!id) return;
    navigator.clipboard?.writeText(id).then(() => SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, 'Variant id copied', 'Dismiss', 3000)).catch(() => {});
  }

  async printMainLabel() {
    const v = this.value();
    if (!v?.id) return;
    try {
      await ScanLabelUtil.printLabels([{
        value: v.id, format: this.mainCodeFormat(), copies: this.labelCopies(),
        title: v.sku, subtitle: [this.parentProduct()?.name, v.variantName].filter(Boolean).join(' — ')
      }]);
    } catch (err) {
      this.dialogUtils.openErrorMessageFromError(err);
    }
  }

  async printAliasLabel(code: ProductVariantScanCode) {
    const v = this.value();
    if (!v) return;
    const format: LabelFormat = code.symbology === ScanCodeSymbology.QR || code.symbology === ScanCodeSymbology.DATA_MATRIX ? 'QR' : 'CODE_128';
    try {
      await ScanLabelUtil.printLabels([{ value: code.codeValue, format, copies: this.labelCopies(), title: v.sku, subtitle: code.label || undefined }]);
    } catch (err) {
      this.dialogUtils.openErrorMessageFromError(err);
    }
  }

  addAlias() {
    const id = this.id();
    if (!id || !this.canAddAlias()) return;
    this.scanCodeService.add(id, { codeValue: this.newAliasValue().trim(), symbology: this.newAliasSymbology(), label: this.newAliasLabel().trim() || null, active: true })
      .pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
        next: () => { this.newAliasValue.set(''); this.newAliasLabel.set(''); this.loadScanCodes(); },
        error: err => this.dialogUtils.openErrorMessageFromError(err)
      });
  }

  toggleAliasActive(code: ProductVariantScanCode) {
    const id = this.id();
    if (!id || !code.id) return;
    this.scanCodeService.patch(id, code.id, { active: !code.active }).subscribe({
      next: saved => this.scanCodes.set(this.scanCodes().map(c => c.id === saved.id ? saved : c)),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  async removeAlias(code: ProductVariantScanCode) {
    const id = this.id();
    if (!id || !code.id) return;
    const ok = await this.dialogUtils.openConfirmDialog('Remove alias?', `"${code.codeValue}" will no longer resolve to this variant when scanned.`, 'Remove', 'Cancel').catch(() => false);
    if (!ok) return;
    this.scanCodeService.delete(id, code.id).subscribe({ next: () => this.loadScanCodes(), error: err => this.dialogUtils.openErrorMessageFromError(err) });
  }

  // ---- Digital files -------------------------------------------------------
  //
  // Files attached to a DIGITAL variant. Managed through their own endpoint
  // (multipart upload → object storage), NOT through the variant JSON, so the
  // list is loaded separately and refreshed after every change. Needs a saved
  // variant (the id names the storage path).
  private digitalAssetService = inject(DigitalAssetService);
  digitalAssets = signal<DigitalAsset[]>([]);
  digitalAssetsLoaded = signal<boolean>(false);
  uploadingAsset = signal<boolean>(false);
  isDigital = computed<boolean>(() => this.value()?.fulfillmentType === VariantFulfillmentType.DIGITAL);
  activeDigitalAssetCount = computed<number>(() => this.digitalAssets().filter(a => a.active).length);

  loadDigitalAssets() {
    const id = this.id();
    if (!id) { this.digitalAssets.set([]); this.digitalAssetsLoaded.set(true); return; }
    this.digitalAssetService.list(id).subscribe({
      next: res => { this.digitalAssets.set(res ?? []); this.digitalAssetsLoaded.set(true); },
      error: () => { this.digitalAssets.set([]); this.digitalAssetsLoaded.set(true); }
    });
  }

  async uploadDigitalAsset() {
    const id = this.id();
    if (!id || this.uploadingAsset()) return;
    let vFile;
    try {
      vFile = await UtilsService.uploadFileAsVFile('*/*');
    } catch {
      return;
    }
    if (!vFile?.rawFile) return;
    this.uploadingAsset.set(true);
    this.digitalAssetService.upload(id, vFile.rawFile, vFile.name).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: () => {
        this.uploadingAsset.set(false);
        this.loadDigitalAssets();
        SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, `Uploaded ${vFile.name}`, 'Dismiss', 4000);
      },
      error: err => { this.uploadingAsset.set(false); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  onDigitalAssetLabelChange(asset: DigitalAsset, label: string) {
    const id = this.id();
    if (!id || !asset.id || (label ?? '') === (asset.label ?? '')) return;
    this.digitalAssetService.patch(id, asset.id, { label }).subscribe({
      next: saved => this.digitalAssets.set(this.digitalAssets().map(a => a.id === saved.id ? saved : a)),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  toggleDigitalAssetActive(asset: DigitalAsset) {
    const id = this.id();
    if (!id || !asset.id) return;
    this.digitalAssetService.patch(id, asset.id, { active: !asset.active }).subscribe({
      next: saved => this.digitalAssets.set(this.digitalAssets().map(a => a.id === saved.id ? saved : a)),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  downloadDigitalAsset(asset: DigitalAsset) {
    const id = this.id();
    if (!id || !asset.id) return;
    this.digitalAssetService.download(id, asset.id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: blob => FileUtils.saveBlobAsFile(asset.fileName || 'download', blob),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  async deleteDigitalAsset(asset: DigitalAsset) {
    const id = this.id();
    if (!id || !asset.id) return;
    const ok = await this.dialogUtils.openConfirmDialog(
      'Delete file?',
      `Delete "${asset.fileName}"? Buyers who purchased this variant will no longer be able to download it.`,
      'Delete', 'Cancel').catch(() => false);
    if (!ok) return;
    this.digitalAssetService.delete(id, asset.id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: () => this.loadDigitalAssets(),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  formatBytes(size?: number | null): string {
    const n = Number(size ?? 0);
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
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
    this.loadDigitalAssets();
    this.loadScanCodes();
    this.renderMainCode();

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

  // ---- Quick stock -----------------------------------------------------------
  //
  // "Add stock" posts a StockMovement through the QuickStockDialog; the server
  // applies the delta. On success we mirror the new balance into the form. If
  // the form is clean the tracking baseline moves too (the change is already
  // persisted, nothing to save); if the admin has unsaved edits we only update
  // the visible value so their draft isn't reset.
  openQuickStockDialog(warehouseId?: string) {
    const v = this.value();
    if (!v?.id) return;
    this.dialogUtils.matDialog
      .open(QuickStockDialog, {
        width: '520px',
        data: {
          variantId: v.id,
          sku: v.sku,
          variantName: v.variantName,
          currentStock: Number(v.stockQuantity ?? 0),
          levels: v.inventoryLevels ?? [],
          warehouseId
        } satisfies QuickStockDialogData
      })
      .afterClosed()
      .subscribe((movement: StockMovement | undefined) => {
        if (!movement) return;
        const current = this.value();
        if (!current) return;
        // Mirror the new balances: total from the movement, the warehouse row from
        // its per-warehouse figure (new warehouses get a row).
        const wid = movement.warehouse?.id;
        const levels = [...(current.inventoryLevels ?? [])];
        const idx = levels.findIndex(l => l.warehouse?.id === wid);
        if (wid && movement.warehouseQuantityAfter !== null && movement.warehouseQuantityAfter !== undefined) {
          if (idx >= 0) levels[idx] = { ...levels[idx], quantity: Number(movement.warehouseQuantityAfter) };
          else levels.push({ id: wid + ':' + current.id, productVariantId: current.id, warehouse: movement.warehouse!, quantity: Number(movement.warehouseQuantityAfter) });
        }
        const updated = { ...current, stockQuantity: movement.quantityAfter, inventoryLevels: levels };
        if (this._value.isValueChange()) {
          this.value.set(updated);
        } else {
          this._value.set(updated);
        }
        SnackBarUtils.openSnackBar(
          this.rxjsUtils.snackBar,
          `Stock ${movement.quantityChange > 0 ? '+' : ''}${movement.quantityChange} → ${movement.quantityAfter} (${movement.movementType})`,
          'Dismiss', 6000
        );
      });
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
    // (0) packaged spec: 0 in the form means "use the product default" → send null
    const packaged = this._value.value();
    if (packaged) {
      for (const k of ['weightGrams', 'lengthMm', 'widthMm', 'heightMm'] as const) {
        if (!Number(packaged[k])) (packaged as any)[k] = null;
      }
    }
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
