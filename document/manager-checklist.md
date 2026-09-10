# Venzora Manager — Implementation Checklist

> **✅ COMPLETE — closed 2026-09-10.** Every feature section (§0–§20) is built and live-verified. The
> browser/testing rounds that were still open have been moved to
> [manager-checklist-2.md](manager-checklist-2.md) (§0 "Carried over"), where all new work is tracked.
> This file stays as the record of what exists and where it lives.

> Tracking what's built and what isn't, ordered by the build priority in `frontend-manager.md` § 12. Update statuses as work lands. When a feature gets completed, leave the checked item plus the file paths so future readers can navigate.

**Status legend** — `[ ]` not started · `[~]` partial / skeleton only · `[x]` done · `[!]` blocked by backend gap (see [§ 11](#11-backend-gaps-tracking))

---

## 0. Foundations *(must exist before feature work)*

### 0.1 Auth shell

Lib already owns this end-to-end — guard, service, login component. The app side just routes through them.

- [x] `AuthGuard` ([src/lib/guards/auth.guard.ts](../src/lib/guards/auth.guard.ts)) — provides `isLogin()` and `isLoginWithRole(role)`.
- [x] JWT `AuthInterceptor` ([src/lib/guards/auth.interceptor.ts](../src/lib/guards/auth.interceptor.ts)).
- [x] `LoginComponent` ([src/lib/share-component/login/](../src/lib/share-component/login/)) wired at `/login` and `/oauth2`.
- [x] Admin route-gate applied to `/catalog` and `/schema` via `canActivate: [async () => inject(AuthGuard).isLoginWithRole('ADMIN')]` ([app.routes.ts:60,77](../src/app/app.routes.ts)). Pattern will repeat for `/commerce`, `/inventory`, `/rules`, `/reports`, `/reviews` as those routes land.

### 0.2 Data layer

- [x] All entity models ([src/app/shared/model/](../src/app/shared/model/))
- [x] All CRUD services extending `ViesRestService<T>` ([src/app/shared/service/](../src/app/shared/service/))
- [x] `PageResponse<T>` flat pagination shape added to lib ([src/lib/model/vies.model.ts](../src/lib/model/vies.model.ts)) alongside the older `Pageable<T>` — both coexist
- [x] Custom services for non-CRUD endpoints:
  - [x] `CheckoutOrchestratorService` ([service](../src/app/shared/service/checkout-orchestrator/checkout-orchestrator.service.ts)) — `/orders/checkout`, `/orders/{id}/complete`. Types: `CheckoutRequest`/`CheckoutResponse` in [checkout.model.ts](../src/app/shared/model/checkout.model.ts).
  - [x] `DiscountValidationService` ([service](../src/app/shared/service/discount-validation/discount-validation.service.ts)) — `/discounts/validate`. Types in [discount-validation.model.ts](../src/app/shared/model/discount-validation.model.ts). Always 200, business rejections in body.
  - [x] `MeService` ([service](../src/app/shared/service/me/me.service.ts)) — `/me/info` (GET/PUT/PATCH), `/me/addresses` (GET/PUT), `/me/reviews` (full CRUD). Auto-attaches `user_id` header from `AuthenticatorService.currentUser`.
  - [x] `PublicProductsService` ([service](../src/app/shared/service/public-products/public-products.service.ts)) — `/public/products/{search,GET,filters,filter-map,{id},{id}/reviews}`. Types: `ProductSearchRequest`, `CategoryFilterDimensions`, `ProductFilterMap`, `FilterMapEntry`, `FilterKind` in [public-product.model.ts](../src/app/shared/model/public-product.model.ts).
  - [x] `ReportsService` ([service](../src/app/shared/service/reports/reports.service.ts)) — 10 endpoints (`tax`, `sales/summary`, `sales/timeseries`, `products/top`, `categories/top`, `geography`, `orders/status`, `refunds`, `customers/summary`, `orders` raw export). Typed response models in [report.model.ts](../src/app/shared/model/report.model.ts).
  - [x] `TaxRuleImportExportService` ([service](../src/app/shared/service/tax-rule-import-export/tax-rule-import-export.service.ts)) — `/tax/rules/export` and `/tax/rules/import?mode=`. Note: these don't inherit the framework admin gate; production must gate at the reverse proxy.

### 0.3 Cross-cutting reusables

> These three are explicitly called out in the intent (§ 7) and every later screen uses them.

- [x] **`<attribute-value-field [definition] [(value)]>`** ([src/app/shared/component/attribute-value-field/](../src/app/shared/component/attribute-value-field/)) — the polymorphic editor (intent § 7.2). Dispatches on `definition.type` to the lib's existing primitives (`<app-mat-form-field-input>`, `<app-mat-form-field-input-option>`, `<app-mat-form-field-input-list-option>`, `<app-mat-form-field-input-time>`, `<mat-slide-toggle>`). On every emit, builds a fresh `AttributeValue` with ONLY the matching slot populated — other slots intentionally undefined to prevent stale-slot persistence. Lives in `src/app/shared/component/` (not `src/lib/`) because the `AttributeDefinition`/`AttributeValue`/`AttributeOption` types are Venzora-specific; if other projects later need this pattern, factor a generic `<dynamic-value-field>` into lib.
- [x] **`<app-money [value] [currency]>`** ([src/lib/util-component/money/](../src/lib/util-component/money/)) — `Intl.NumberFormat` wrapper for BigDecimal-as-string. Registered in `NgComponentModule`. Falls back to `"{value} {currency}"` on Intl rejection (unknown ISO code, malformed value). Lives in lib for cross-project reuse.
- [x] **DateTime conversion helpers** — added `fromJsDate(d: Date)` and `toJsDate(dt)` as static methods on `ViesDate`, `ViesTime`, `ViesDateTime` ([src/lib/model/vies.model.ts](../src/lib/model/vies.model.ts)). The existing `now()` methods now delegate to `fromJsDate(new Date())`. Static (not instance) so they work on plain-object JSON literals from the wire, not only class instances.

### 0.4 Information architecture

> Current routes are flatter (`product/list`, `product/attribute/definition/list`); intent wants a `/catalog`, `/schema`, `/commerce`, `/inventory`, `/rules`, `/reports`, `/reviews` shell (intent § 4).

- [x] Restructure `app.routes.ts` to nest:
  - [x] `/catalog/products` (`catalogProductList`, `catalogProduct(id)`)
  - [x] `/schema/attribute-definitions`, `/schema/attribute-options` (`schemaAttribute*` helpers)
  - [x] Placeholder directories created for `/catalog/{categories,tags,media}`, `/commerce`, `/inventory`, `/rules`, `/reports`, `/reviews` — routes will be added as each feature lands
- [x] Left-nav reorganized to match the IA — `Catalog` and `Schema` sections ([app.ts:39-77](../src/app/app.ts#L39-L77))
- [x] Decided: full folder restructure (not just routes). `src/app/product/` deleted; files moved to `src/app/catalog/products/` and `src/app/schema/attribute-{definitions,options}/`. All relative imports + route helper call-sites updated.

### 0.5 Utilities

- [x] **Error mapper** ([src/lib/util/Error.utils.ts](../src/lib/util/Error.utils.ts)) — `ErrorMapper.map(error)` normalizes any thrown error (HttpErrorResponse, Spring `@Valid` `errors[]`, `fieldErrors[]`, `ViesErrorResponse`, plain string, JS Error) into `FieldError[]` with `{field?, message}`. Helpers: `getFieldError(errors, name)`, `getGeneralErrors(errors)`, `toMessage(errors)`. Forms route to control errors via `field`; toasts/banners use general errors.
- [x] **Cascade-delete confirmation** — `DialogUtils.openCascadeDeleteConfirm(entityLabel, deps)` ([Dialog.utils.ts](../src/lib/util/Dialog.utils.ts)) auto-formats "Deleting this {Entity} will also delete N variants, M attributes." from a `{label, count}[]` array. Returns `Promise<boolean>` (true = confirm, false = cancel) so callers can `if (await ...)` cleanly. Zero-count deps elided automatically.
- [x] **Optimistic-UI helper** ([src/lib/util/Optimistic.utils.ts](../src/lib/util/Optimistic.utils.ts)) — `OptimisticUpdate.apply(signal, newValue, serverCall)` writes the optimistic value, runs the server call, rolls back on error and re-throws. Variant `applyVia(apply, revert, newValue, serverCall)` for non-signal state (BehaviorSubject, plain field, parent callbacks).

---

## 1. Schema editor *(foundation — nothing else works without this)*

`AttributeDefinition` + `AttributeOption`. Intent §§ 5.1, 6.1, 6.2.

- [x] `AttributeDefinitionListComponent` ([src/app/schema/attribute-definitions/attribute-definition-list/](../src/app/schema/attribute-definitions/attribute-definition-list/)) — `<app-mat-table>` over the registry, add button routes to `/schema/attribute-definitions/`
- [x] `AttributeDefinitionComponent` ([src/app/schema/attribute-definitions/attribute-definition/](../src/app/schema/attribute-definitions/attribute-definition/)) — decorator-driven main form, conditional inline options editor (only for SELECT/MULTI_SELECT), inline `.schema-hint` explanations for `variantLevel`/`required`, `save()` normalizes `sortOrder` to drag-reordered position, `remove()` uses `openCascadeDeleteConfirm` with the option count and navigates back to the list
- [x] `AttributeOptionListComponent` ([src/app/schema/attribute-options/attribute-option-list/](../src/app/schema/attribute-options/attribute-option-list/)) — kept as the "surgical edits" entry point per spec § 6.2. Dropped the unused `showTable=false` selector mode (was only used by the now-removed nested usage)
- [x] `AttributeOptionComponent` ([src/app/schema/attribute-options/attribute-option/](../src/app/schema/attribute-options/attribute-option/)) — decorator-driven form, `remove()` navigates back to the options list
- [x] Inline option editor for `SELECT`/`MULTI_SELECT` types — `<app-mat-form-field-input-list>` over `value.options` with drag-and-drop, sortOrder normalized at save
- [x] Inline explanation when toggling `variantLevel` / `required` (rendered as `.schema-hint` blocks beneath the main form)
- [x] Routes already at `/schema/{attribute-definitions,attribute-options}/...` (done in §0.4)

> **Note**: `<app-attribute-value-field>` is intentionally NOT used here — the schema editor edits the *definition* (scalar fields: name, type, unit, required, etc.), not values *against* the definition. The polymorphic editor's first real consumer will be the product editor (§3) when binding `ProductAttribute.attributeValue` / `ProductVariantAttribute.attributeValue`.

---

## 2. Categories + Tags

Intent § 5.2 and § 5.5 of [api.md].

- [x] `CategoryListComponent` ([src/app/catalog/categories/category-list/](../src/app/catalog/categories/category-list/)) — `<mat-tree>` rendered from a `CategoryNode` tree built client-side from `parentCategoryId`. Surfaces orphans (categories whose parent id points at a deleted row) under a "⚠ Orphaned" pseudo-root so they're visible for cleanup. Modern `[childrenAccessor]` API; expand/collapse via toggle button.
- [x] `CategoryComponent` ([src/app/catalog/categories/category/](../src/app/catalog/categories/category/)) — decorator-driven main form for name/description, dedicated `<app-mat-form-field-input-option>` parent picker (single-select with `(root)` blank option), dedicated `<app-mat-form-field-input-list-option>` for the M2M `attributeDefinitions`, child-count hint, cascade-delete confirm showing orphan-child count
- [x] Client-side cycle detection — parent picker's `parentOptions` excludes `self + all descendants`, so the admin can't pick a bad parent in the first place
- [x] Drag-to-reparent — native HTML5 drag on the category tree nodes: drop onto a node to become its child, or onto the "make root" zone to clear the parent. Client-side cycle guard (self/descendants excluded — backend has no FK to catch loops), full-object PUT, refresh after. ([category-list.component.ts](../src/app/catalog/categories/category-list/category-list.component.ts))
- [x] Cascade-delete confirmation with child count — child count exposed via `childCount` computed; passed to `openCascadeDeleteConfirm` as a `{label, count}` dep
- [x] `TagListComponent` ([src/app/catalog/tags/tag-list/](../src/app/catalog/tags/tag-list/)) — plain `<app-mat-table>` over the registry, add button routes to `/catalog/tags/new`
- [x] `TagComponent` ([src/app/catalog/tags/tag/](../src/app/catalog/tags/tag/)) — decorator-driven form, cascade-delete (no deps), navigates to tag list after delete
- [x] Routes: `/catalog/tags/{list,new,:id}` and `/catalog/categories/{list,new,:id}`. Left-nav under "Catalog" — Products, Categories, Tags (each with "New X" companion).

---

## 3. Product editor *(the hero flow — longest single piece of work)*

Intent § 5.3. Multi-section editor implemented as a `<mat-tab-group>` with `preserveContent` so state survives tab switches.

- [x] `ProductComponent` ([src/app/catalog/products/product.component.ts](../src/app/catalog/products/product.component.ts)) — full four-tab editor (Basics / Attributes / Variants / Media). Extends `ViesRestApi` for CRUD + `ValueTracking`. ~380 LOC.
- [x] `ProductListComponent` ([src/app/catalog/products/product-list/](../src/app/catalog/products/product-list/)) — `<app-mat-table>` filtered by client-side search (name/SKU substring) + status dropdown. Row click → edit.
- [x] **Basics section**: name, description, currency, basePrice, baseSku, status via decorator-driven `<app-mat-form-field-input-dynamic>`; category via dedicated autocomplete showing ancestry path (`Apparel > Tops > T-Shirts`) with reused `CategoryQuickAddDialog` for inline creation; tags via `<app-mat-form-field-input-list-option>` (multi-select from global Tag pool).
- [x] **Product-level attributes section**: rows of `ProductAttribute` — definition picker (excludes already-used definitions to prevent duplicates), value editor via `<app-attribute-value-field>` (the polymorphic component from §0.3), auto-clears stale value slot on definition change.
- [x] **Variant-level attributes section + generator**:
  - Multi-select of variant-level `AttributeDefinition`s → per-definition option pickers appear.
  - `generatorSize` computed shows cartesian preview count before the admin commits.
  - "Generate variants" computes cartesian product client-side, builds a `ProductVariant` per combination with derived SKU (`{baseSku}-{OPT1}-{OPT2}`), base price, stock 0, ACTIVE status, and matching `ProductVariantAttribute` per slot. Idempotent — skips SKUs already present locally.
  - Backend has no `POST /products/{id}/generate-variants` endpoint (intent § 11 gap), so variants are cascade-saved via the parent Product PUT — no per-variant POST needed.
- [x] **Variants table**: dynamic-form row per variant for inline editing of SKU, name, price, stock, weight, status. Delete button per row.
- [x] **Variant detail**: SUPERSEDED by the standalone `ProductVariantComponent` at `/catalog/products/:pid/variants/:id` ([product-variant.component.ts](../src/app/catalog/products/product-variant/product-variant.component.ts)) — per-variant attribute rows via `<app-attribute-value-field>`, per-variant media via the gallery, pricing modes with effective-price preview, clone. The planned `VariantDetailDialog` was never needed; the Variants tab is list-only and navigates here.
- [x] **Media section**: per-product gallery via dynamic-form rows per `ProductMedia`. `isPrimary` toggle handler clears the flag on all other rows on activation (server doesn't enforce uniqueness).
- [x] Save issues a PUT (or POST for new) with the full product graph via the inherited `ViesRestApi.save()`. Delete uses `openCascadeDeleteConfirm` with three dep counts (variants, attributes, media).
- [~] Spinner: `RxJSUtils.waitLoadingDialog()` wraps the fetch/save calls via the base class. Optimistic UI for cheap toggles remains deliberately unwired: every editor routes through explicit Save + `ValueTracking` (no independent cheap toggles exist), so there's nothing to apply `OptimisticUpdate` to today. Revisit only if standalone toggles appear.

**Model change made along the way**: added `@MatInputHide()` + `@MatTableHide()` to `Product.tags` (was rendering as inline sub-form, but the product editor uses a dedicated multi-select from the Tag pool — cleaner UX).

---

## 4. Orders & fulfillment

Intent § 5.4. Now means `OrderFulfillment`, and payment status lives on `CheckoutOrder` in the library.

- [x] `OrderListComponent` ([src/app/commerce/orders/order-list/](../src/app/commerce/orders/order-list/)) — queue at `/commerce/orders/list` with `FulfillmentStatus` filter + `orderNumber` search. No Add button — orders come from checkout.
- [x] `OrderComponent` ([src/app/commerce/orders/order/](../src/app/commerce/orders/order/)) — four-tab detail (Basics / Items / Addresses / Metadata / Payment). Status transitions gated by a `STATUS_TRANSITIONS` graph (UI-enforced since backend doesn't); transition buttons stage locally, Save commits. Server-managed fields (`orderNumber`, `currency`, totals) render disabled via model decorators. Items are a read-only snapshot table; addresses render as disabled dynamic forms.
- [x] **Payment-side fetch** — `CheckoutOrderService` ([src/app/shared/service/checkout-order/](../src/app/shared/service/checkout-order/)) resolves `checkoutOrderId` against library `GET /api/v1/checkout/orders/{id}`. Loose-typed `CheckoutOrderView` (index signature) since the checkout module's shape isn't mirrored here; the Payment tab renders scalar fields generically + a transaction audit list. Fetched on demand, not on init.
- [x] **Order metadata viewer** (intent § 5.11):
  - [x] System keys (`checkout.*`, `tax.*`, `discount.*`, `shipping.*`) rendered as read-only audit table; unknown prefixes fall into a read-only catch-all panel
  - [x] `notes.*` keys editable list grouped by topic; "add note" form auto-namespaces new topics under `notes.`
- [x] Trigger shipment creation from the order detail (→ `/commerce/shipments/new?orderId=`)
- [x] Trigger return creation from the order detail (→ `/commerce/returns/new?orderId=`)
- [x] Webhook → fulfillment status listener — IMPLEMENTED backend-side 2026-09-01: `CheckoutFulfillmentListener` (Venzora) consumes the library's `CheckoutOrderStatusChangedEvent` and maps CAPTURED→PROCESSING (+stock decrement, deduped with `complete()` via a `checkout.stockDecremented` metadata flag), REFUNDED/PARTIALLY_REFUNDED→same, CANCELLED/FAILED→same (only from PENDING). `complete()` is now idempotent when the webhook lands first. No frontend change needed.

---

## 5. Returns (RMA)

Intent § 5.5. Now means `ReturnRequest` referencing `OrderFulfillment` + `OrderFulfillmentItem`.

- [x] `ReturnListComponent` ([src/app/commerce/returns/return-list/](../src/app/commerce/returns/return-list/)) — RMA queue at `/commerce/returns/list` with `ReturnStatus` filter + `returnNumber` search
- [x] `ReturnComponent` ([src/app/commerce/returns/return/](../src/app/commerce/returns/return/)) — order+item pickers on create (item options filtered to the linked order's lines), decorator form for reason/`adminNotes`/`returnQuantity`/`refundAmount`/tracking, workflow buttons per the transition graph
- [x] On refundable status (`APPROVED`/`RECEIVED`/`INSPECTING`) + payment link: "Issue PayPal refund" calls library `POST /api/v1/checkout/orders/paypal/{checkoutOrderId}/refund?amount=&reason=` (confirm-first; empty `refundAmount` = full refund)
- [x] After refund, PATCHes `OrderFulfillment.status` to `REFUNDED` / `PARTIALLY_REFUNDED` (partial = refundAmount < order total), then stamps the return `REFUNDED` and saves
- [x] Lifecycle guard: `RETURN_TRANSITIONS` graph in the component — terminal states show no buttons

---

## 6. Shipments

Intent § 5.4 (implicitly).

- [x] `ShipmentListComponent` ([src/app/commerce/shipments/shipment-list/](../src/app/commerce/shipments/shipment-list/)) — queue at `/commerce/shipments/list` with `ShipmentStatus` filter + tracking/carrier search
- [x] `ShipmentComponent` ([src/app/commerce/shipments/shipment/](../src/app/commerce/shipments/shipment/)) — `trackingNumber` (unique → 409 via error dialog), `carrier`, `ShipmentStatus`, both delivery dates via `<app-mat-form-field-input-time>` date pickers (BOTH non-nullable — blank object defaults them to now so create always sends values). Order link: autocomplete on create (or pre-linked via `?orderId=`), read-only chip + "Open order" once saved. Save reduces the order ref to a bare `{id}`.

---

## 7. Discounts

Intent § 5.7.

- [x] `DiscountListComponent` ([src/app/commerce/discounts/discount-list/](../src/app/commerce/discounts/discount-list/)) at `/commerce/discounts/list` — code/description search
- [x] `DiscountComponent` ([src/app/commerce/discounts/discount/](../src/app/commerce/discounts/discount/)) — `discountType` selector in the decorator form; a mode-adaptive hint under the form explains what `discountValue` means per type (percent / amount / ignored / promo-encoded)
- [x] `validFrom` / `validTo` via `<app-mat-form-field-input-time>` date pickers (hidden from the dynamic form — ViesDateTime would explode into a dozen scalar inputs)
- [x] `currentUses` shown read-only (`@MatInputDisable`, server-bumped at checkout)
- [x] No client-side validation logic — orchestrator enforces at checkout

---

## 8. Commerce rules

### 8.1 Shipping rules

Intent § 5.8.1.

- [x] `ShippingRuleListComponent` ([src/app/rules/shipping/shipping-rule-list/](../src/app/rules/shipping/shipping-rule-list/)) at `/rules/shipping/list` — one row per currency, zero-shipping-fallback hint
- [x] Add-rule flow: custom currency picker EXCLUDES currencies that already have a rule (own currency stays available on edit) — `currency` is `@MatInputHide` on the model so the dynamic form doesn't render a conflicting enum select
- [x] Edit `flatFee`, `freeAboveAmount` (empty disables threshold — hint under the form), `description`, `active`

### 8.2 Tax rules

Intent § 5.8.2. The most flexible piece.

- [x] `TaxRuleListComponent` ([src/app/rules/tax/tax-rule-list/](../src/app/rules/tax/tax-rule-list/)) at `/rules/tax/list` sorted by `(specificity DESC, priority DESC)` — the eval order, called out in the header hint
- [x] `TaxRuleComponent` ([src/app/rules/tax/tax-rule/](../src/app/rules/tax/tax-rule/)) — `name`, `rate`, four matcher fields (empty = match any, per-field placeholders), live specificity readout ("2/4 — state-level") under the form
- [x] **Export button** → `GET /api/v1/tax/rules/export` → downloads `tax-rules.json`
- [x] **Import** — file picker → `append`/`replace` radio → `POST /api/v1/tax/rules/import?mode=`
  - [x] On `replace`: confirmation shows the count of existing rules that will be deleted
- [x] **Test pad** — type a shipping address on the list page, see which rule wins (client-side reproduction of the matching algorithm; informational only)

---

## 9. Inventory

Intent § 5.6.

- [x] `StockComponent` ([src/app/inventory/stock/](../src/app/inventory/stock/)) at `/inventory/stock` — per-variant stock joined with product names, product/variant/SKU search, low-stock-only toggle with an adjustable threshold (low rows highlighted)
- [x] Adjustment flow: inline per-row panel inserts a new `StockMovement` (type `ADJUSTMENT`, quantityChange ±, required reason, optional reference) then re-fetches — **never PATCHes `quantityAfter`**
- [x] `StockMovementListComponent` ([src/app/inventory/stock-movement-list/](../src/app/inventory/stock-movement-list/)) at `/inventory/movements` — append-only audit log, movement-type filter + reason/reference search

---

## 10. Reviews + reports + polish

### 10.1 Reviews moderation

Intent § 5.9.

- [x] `ReviewListComponent` ([src/app/reviews/review-list/](../src/app/reviews/review-list/)) at `/reviews` — table with product-name resolution (best-effort against the catalog), rating sort toggle (lowest-first default — the moderation view), search, per-row delete with confirm. No status filter — the Review model has no moderation-status field today.
- [x] Public review write — RESOLVED: the backend ships `/api/v1/me/reviews` (GET/POST/PUT/DELETE, ownership enforced from the `user_id` header). The Manager only moderates; a storefront writes through `/me/reviews`.

### 10.2 Reports & analytics

Intent § 5.10. Hits `/api/v1/reports/*` (10 endpoints). All in one `ReportsComponent` ([src/app/reports/](../src/app/reports/)) at `/reports`.

- [x] Period picker — from/to date pickers + presets (7/30/90 days, this month, this year); from = start-of-day, to = end-of-day
- [x] "Run reports" fans out all nine read endpoints in parallel per period
- [x] **Tax filing** *(highest value)* — `/reports/tax` table grouped by jurisdiction with per-currency totals rows, CSV download. Caption notes `matchingRule` is informational only; historical record lives in `OrderFulfillment.metadata.tax.*`
- [x] **Sales dashboard** — KPI cards (`/sales/summary`); timeseries now renders as a revenue LINE chart per currency, top products and geography as horizontal BAR charts (top 10/12 by revenue), all above their tables (tables stay as the data of record). Charts via the new reusable `<app-chart>` (src/lib, Chart.js 4, fixed-order validated palette, dark/light aware, SSR-guarded). Done 2026-09-01.
- [x] **Order pipeline** — status DONUT (legend right, 2px surface gaps) above the status/count/% table. Done 2026-09-01.
- [x] **Refunds + customers** panels
- [x] **Raw export** — stitches paginated `/reports/orders` (1000/page) into one `orders-export.csv`

### 10.3 Polish

- [x] Density-optimized tables across the app — global compact styles in `styles.scss` (36px mat-table rows, tighter cell padding, 13px, compact paginator + .report-table). Done 2026-09-01.
- [~] Keyboard shortcuts — **Ctrl+S / Cmd+S saves** on all 12 entity editors (new handler in the lib's `appMatFormFieldGroup` directive, `[formSummitButton]` bound to each Save button; also activates the directive's existing enter-to-submit). Esc already closes dialogs (Material default). Row navigation on lists not done — deferred. 2026-09-01
- [x] Chart rendering for the reports dashboard — timeseries line, status donut, geography + top-products horizontal bars. A true geographic MAP was consciously skipped (needs topojson + projection for marginal value at this data volume); horizontal bars by location instead. 2026-09-01
- [x] *(moved to [manager-checklist-2.md](manager-checklist-2.md))* AI-assisted features (auto-tag, auto-categorize) — defer per intent § 12

---

## 11. Backend gaps tracking

These block specific Manager features. Track them so we don't accidentally try to build around them.

- [x] **Variant generator** — IMPLEMENTED 2026-09-01: backend `POST /api/v1/products/{id}/generate-variants` (admin-gated; SELECT-definition axes with optional option subsets; cartesian product capped at 500; SKU `{baseSku}-{OPT1}-{OPT2}`, skips existing SKUs locally AND globally; one cascading product save; returns `{created, skipped, product}`) + frontend `VariantGeneratorDialog` behind a "Generate variants…" button on the Variants tab (axis + option pickers, live combo count, swaps in the returned product graph).
- [x] ~~**Media uploader**~~ — RESOLVED client-side: the media gallery + source dialog upload through `ObjectStorageService` (deferred until parent save), track `ProductMedia.objectStorageDataId`, and clean up orphaned storage files after successful saves
- [x] **Webhook → fulfillment listener** — implemented; see § 4.
- [x] **Login / refresh-token paths** — CONFIRMED: all 10 `/api/v1/authenticators/*` endpoints exist and are wired (login verified live repeatedly).
- [x] **Public review write** — resolved via `/api/v1/me/reviews`; see § 10.1.

---

## Notes

- **Source of truth** for entity shapes: `api.md` § 3–10 (in the backend repo). Memory pointers: [project_venzora_backend_contract] and [project_venzora_api_contract].
- **Source of truth** for intent: `frontend-manager.md` (in the backend repo). Memory pointer: [project_venzora_manager_intent].
- **Library-first preference**: when introducing new primitives (the three reusables, error mapper, cascade-delete helper), put them in `src/lib/` if they'd benefit other Angular projects, not in `src/app/`.
- **No NgRx unless really needed** (intent § 2). Service + signals is the default.

---

## 12. Dynamic permission system (RBAC) — added 2026-09-03

Design: `vies-spring-utils/document/permission-system.md` (grammar is FROZEN there).
Model: users → roles → permissions AND users → groups → roles → permissions; permission
strings (`resource:action`, `*` wildcards) live only on the new `Role` entity.

- [x] **Library 6.4.0** (411 tests green, deployed): `Role` entity + CRUD (`/api/v1/roles`,
  gated on `iam:*`), `User.roles` + `UserGroup.roles` M2M, `PermissionStrings` grammar +
  matcher, `ViesPermission` manual-check API (`hasAuthority/hasAnyAuthority/hasAllAuthorities`,
  `hasRole/hasAnyRole/hasAllRoles`, `hasGroup/...`, `getEffectivePermissions[WithProvenance]`),
  `@RequiresUser/@RequiresAuthority/@RequiresRole/@RequiresGroup` (ANY/ALL modes, class-level,
  meta-annotation shortcuts) enforced by a HandlerInterceptor, `@CurrentUserId` argument
  resolver, `@PublicEndpoint` + `SecurityArchitecture.assertAllEndpointsGated(...)`,
  `resourceName()` verb→authority mapping on admin CRUD controllers (null = legacy admin
  check), `adminBypassAuthority()` row-bypass refinement, idempotent SUPER_ADMIN (`*`) seed
  attached to the ADMIN group. Debug: `GET /api/v1/roles/effective/{userId}` (provenance).
- [x] **Venzora adoption**: every admin CRUD controller declares its resource (catalog /
  schema / orders / shipments / discounts / inventory / rules / reviews / customers);
  hand-written endpoints annotated (reports:read — previously UNGATED; rules:read/update on
  tax export/import — previously UNGATED; catalog:update on the variant generator;
  @RequiresUser on orchestrator + discount-validate + /me/*; @PublicEndpoint on the two
  public controllers); orders/returns row-bypass now keys on orders:manage / returns:manage;
  section roles seeded create-if-absent (SHIPPING_ADMIN, INVENTORY_ADMIN, CATALOG_ADMIN,
  FINANCE_ADMIN); `SecurityArchitectureTest` enforces default-deny at build time.
- [x] **Manager frontend** (2026-09-04, hand-built step by step): all in `src/lib` (vocabulary-free)
  except the wiring —
  `util/Permission.utils.ts` (`PermissionStrings` grammar port with right-aligned matching +
  `PermissionUtils` client-side resolution/provenance; verified against the Java test vectors),
  `Role` model + `roles` on `User`/`UserGroup`, `model/permission.model.ts` (`KNOWN_PERMISSIONS`
  InjectionToken — the app supplies the words), `service/role.service.ts` (CRUD + `/roles/effective`),
  `AuthenticatorService.hasAuthority/hasAnyAuthority/hasAllAuthorities/hasRole` (+`$`, +
  `hasAuthorityOrAdmin` legacy fallback, `refreshCurrentUser`), `AuthGuard.isLoginWithAuthority`
  (Promise-resolving; lacking → snackbar + home), `app-mat-form-field-input-permission` (chips editor:
  grammar validation with a grammar-teaching inline error, suggestions from the catalog, `resource:*`
  and `*` offered), `app-role-list` (list → editor; SUPER_ADMIN delete-protected, `*` removal warned),
  `EffectivePermissionsDialog` (server provenance + unsaved preview), user editor roles picker +
  "Effective permissions…" button, user-group editor rewritten list→editor with a roles picker
  (seeded groups delete-protected). App: `setting/roles` route + "Roles & permissions" nav,
  `VENZORA_PERMISSIONS` catalog provider, every admin route/nav section gated on authorities
  (catalog/schema/orders|shipments|returns|discounts/rules/inventory/reviews|reports/maintenance/iam)
  with per-child gating in Commerce/Insights and the legacy-ADMIN fallback. Zero-warning build.
- [x] *(moved to [manager-checklist-2.md](manager-checklist-2.md))* **Testing round**: log in as a seeded section admin (create a user in only e.g.
  SHIPPING_ADMIN) and verify: shipments CRUD 200, catalog write 403, refund 403, reports 403;
  admin/admin (SUPER_ADMIN via ADMIN group) unchanged; `GET /api/v1/roles/effective/{id}`
  explains every grant.

---

## 13. Quick stock + order restock, and Maintenance mode — added 2026-09-04

### 13.1 Quick stock (variant) + restock from an order
- [x] **Backend** (Venzora): `StockMovementService.recordOrderMovement/recordRestock` generalize the
  ledger writer; new `POST /api/v1/orders/{id}/restock` (`OrderRestockController` +
  `OrderRestockService`, gated `orders:restock` OR `inventory:update`) writes one RETURN movement
  per item, tracks progress in `metadata.restock.<itemId>`, refuses more than sold, requires a
  REFUNDED / PARTIALLY_REFUNDED / RETURNED / CANCELLED order whose stock actually left
  (`checkout.stockDecremented`). FINANCE_ADMIN seeded with `orders:restock`.
- [x] **Variant editor**: "Add / adjust stock…" button under Basics (saved variants only) opens the new
  shared `QuickStockDialog` (type PURCHASE/RETURN/ADJUSTMENT/DAMAGE/TRANSFER, signed projection,
  can't go below zero) → posts a StockMovement; the form mirrors `quantityAfter`
  ([quick-stock-dialog](../src/app/shared/component/quick-stock-dialog/)).
- [x] **Order editor → Items tab**: a *Restock* panel appears for refund/return statuses — per-item
  sold / restocked / remaining with editable "restock now" (capped at remaining), disabled until the
  status change is saved; confirm → `OrderRestockService.restock` → order graph refreshed.
  `restock.*` metadata keys render in the system audit list.

### 13.2 Maintenance mode
- [x] **Library 6.5.0** (433 tests, deployed; doc `vies-spring-utils/document/maintenance-mode.md`):
  `MaintenanceWindow` (name, message, manual `active`, `startAt`/`endAt` schedule), effective =
  ANY window on; `GET /api/v1/maintenance/status` (public), `POST /toggle` (`maintenance:update`),
  CRUD (resource `maintenance`); `MaintenanceInterceptor` answers **503 + `{maintenance:true,…}`**
  to everyone except OPTIONS, the login/refresh/user/health/status allowlist, and holders of
  `maintenance:bypass` / legacy ADMIN. Status cached 3 s, invalidated on writes. Flags
  `enabledMaintenanceController` / `enabledMaintenanceGate`.
- [x] **Venzora**: seeder now ADDITIVE — `maintenance:bypass` unioned into every section-admin role
  (existing roles get it on next start).
- [x] **Frontend lib** (`src/lib`): `MaintenanceService` (status signal, `refreshStatus`, `toggle`) +
  `MaintenanceWindowService` (CRUD), `MaintenanceInterceptor` (503 maintenance → `/maintenance`),
  `MaintenancePageComponent` (`viescloud-maintenance-page`, "Check again" re-probes and returns home).
- [x] **Manager**: `/system/maintenance` control room (status card, switch-now with message,
  scheduled windows table + editor with DATE_TIME pickers), nav *System → Maintenance mode*, red
  banner under the header while ON (blue "scheduled" banner when a window is upcoming; polled every
  60 s), `maintenanceGuard` on the test shop (non-admins → `/maintenance`), interceptor registered.
- [x] *(moved to [manager-checklist-2.md](manager-checklist-2.md))* **Testing round**: restart backend (VS Code Java reload first — lib bumped to 6.5.0); as admin
  turn maintenance ON → banner shows, admin screens keep working; as a NORMAL user any API call →
  503 with `maintenance:true` and the shop routes to `/maintenance`; turn OFF → "Check again" returns
  home. Restock: capture an order, refund it, save REFUNDED, Items tab → Restock → stock + a RETURN
  movement per item; a second restock is capped at the remainder. Variant editor → Add stock →
  balance + PURCHASE movement.

---

## 14. Tax rules v2 — aliases, district, product matchers (2026-09-04)

- [x] **Backend** (Venzora, built; `TaxCalculatorTest` unit-tests the matching + per-line math without a DB):
  `Address.district` (+ `shipping_district`/`billing_district` on orders, user addresses via the element
  collection); `TaxRule.countryAliases[]`, `stateAliases[]` (TEXT via StringListConverter), `district`,
  and M2M `tags` / `categories` / `attributeDefinitions` (join tables `tax_rule_*`). Matching moved INTO
  `TaxRule` (`matchesLocation` alias-aware, `matchesProduct` any-overlap with category ANCESTORS,
  `specificity` = location + product matchers) so checkout and the tax report share one definition.
  `TaxCalculator.calculateForCart` computes tax **per line item** with discount proration (exact remainder),
  returns `TaxCalculation.lines`, and the orchestrator stores `tax.line.<sku>` + `tax.mixed`/`tax.rules`
  metadata; the amount-only `calculate` path skips product-matcher rules. Reports' jurisdiction "matching
  rule" uses the alias-aware matcher and skips product-level rules.
- [x] **Manager**: `Address` form gains "District (optional)" everywhere it's rendered (checkout, order
  addresses); tax-rule editor adds District, comma-separated Country/State alias inputs, and Tag / Category /
  Attribute-definition pickers with an 8-point specificity readout; the list's evaluation order and the
  **test pad** mirror the new algorithm (aliases, district, optional product picker with ancestor-aware
  category matching). Zero-warning build.
- [x] *(moved to [manager-checklist-2.md](manager-checklist-2.md))* **Testing round** (needs backend restart — new columns/join tables are created by ddl-auto): rule
  `US` + alias "United States" → checkout with country "United States" taxes; a category rule on "Apparel"
  taxes a T-Shirt line while a food line takes the general rule (`tax.mixed=true`, per-line metadata);
  district-only rule; test pad agrees with what checkout stored.

---

## 15. Discounts v2 — product matchers + usage-cap fix (2026-09-04)

- [x] **Backend**: `Discount.tags` / `categories` / `attributeDefinitions` (M2M, join tables `discount_*`),
  matching through the new shared `ProductMatching` helper (also adopted by `TaxRule`/`TaxCalculator`,
  so tax rules and discounts agree on "product has ANY of…", categories incl. ancestors). A scoped
  discount is computed on the ELIGIBLE lines' subtotal (percentage, fixed amount and cap alike); the
  minimum-order check stays order-level; a cart with no qualifying line is rejected with
  "No items in the cart qualify for discount X" (checkout 400 / validate preview `valid=false`).
  Tax proration now spreads the discount only over eligible lines
  (`TaxCalculator.calculateForCart(..., eligibleVariantIds)`). `/discounts/validate` returns
  `eligibleSubtotal`; order metadata gains `discount.scoped`.
- [x] **Usage cap bug fixed**: the Manager sends `maxUses = 0` for "unlimited", but the backend only
  treated `null` as unlimited → a fresh discount hit "usage limit reached" (0 ≥ 0) on first use.
  Now `null` OR `<= 0` = unlimited (`Discount.isUnlimited()`), `currentUses` bump is null-safe and
  still increments on every checkout start regardless of cap. Manager label: "Max Uses — 0 = unlimited".
- [x] **Manager**: discount editor gains the same Tag / Category / Attribute-definition pickers as tax
  rules with a "product-scoped" readout; model + validation DTO updated. Zero-warning build.
- [x] *(moved to [manager-checklist-2.md](manager-checklist-2.md))* **Testing round** (restart backend — new join tables): discount with maxUses 0 applies repeatedly
  and `currentUses` climbs; a category-scoped 10% discount on "Apparel" reduces only the shirt line
  (order shows `discount.scoped=true`; tax on the food line unchanged); validate preview returns
  `eligibleSubtotal`; cart with no qualifying item → clear rejection.

---

## 16. SMTP settings (outbound mail) — stage-setting (2026-09-04)

- [x] **Lib 6.5.2 (deployed)**: `SmtpProviderController` declares authority resource `smtp`
  (`smtp:read/create/update/delete`); `SmtpSenderController` requires `smtp:send` on both POST
  forms. Docs: permission-system.md §8, api.md §6 (sender path is `/api/v1/smtp/senders`).
- [x] **Venzora on 6.5.2**: new seeded `SYSTEM_ADMIN` role = `smtp:*` + `maintenance:*` (additive seeder).
- [x] **Manager / src/lib**: `model/smtp.model.ts` (SmtpProvider, EmailMessage, Email),
  `service/smtp.service.ts` (`SmtpProviderService` CRUD + `SmtpSenderService.sendWith/sendVia`),
  `share-component/smtp-provider-list` (table → editor with password show/hide, default-provider
  uniqueness handled client-side, "send a test email" panel posting the on-screen settings inline,
  synchronous so SMTP errors surface). Route `setting/smtp-providers` (`smtp:read`), Settings nav
  entry, `smtp` in the permission catalog. Zero-warning build.
- [x] *(moved to [manager-checklist-2.md](manager-checklist-2.md))* **Testing round** (restart backend): add a Gmail/app-password provider, send a test email,
  wrong password → error shown inline; flip default between two rows → only one keeps the flag;
  a user holding only SYSTEM_ADMIN sees the Settings entry and can read/edit; without `smtp:send`
  the test panel is hidden.

---

## 17. Digital products (2026-09-04) — built, restart pending

- [x] **Backend**: `ProductVariant.fulfillmentType` PHYSICAL|DIGITAL (column default keeps old rows),
  `DigitalAsset` (files in lib object storage via `DigitalAssetStorage`, path
  `/{adminId}/venzora/digital/{variantId}/{assetId}/{file}`), `DigitalEntitlement` (per paid digital
  order line; points at the variant so later files are included), `DigitalEntitlementService`
  (`afterCapture` idempotent from both capture paths; digital-only → DELIVERED; refund → revoke),
  `DigitalDeliveryMailer` ("downloads ready" via default SMTP provider, background thread,
  `venzora.storefront-url` link), endpoints in api.md §7.12. Checkout: no stock check / SALE
  movement for digital lines, digital-only cart needs no shipping address and pays no shipping,
  tax at billing address; restock skips digital lines. Multipart limit 512MB. 5 new unit tests
  green; SecurityArchitectureTest green.
- [x] **Manager**: variant editor gains *Fulfillment type* (Basics) and a *Digital files* tab
  (upload → object storage, label, active toggle, staff download, delete; quick-stock hidden for
  digital). Order editor: *Digital downloads* panel (entitlement state, files, revoke/restore,
  grant / grant & email). Test shop: product page shows a digital note; buyer order page gains a
  *Downloads* panel (per-file download with the server's availability reason) and hides Shipping
  for digital-only orders. Zero-warning build.
- [x] **Backend live-verified 2026-09-04 (jar run with profile local)**: startup fix — Spring Data
  derived query needed `findAllByProductVariant_Id…` (nested id). Then over HTTP as admin: create
  DIGITAL variant → multipart upload → list/patch/staff download (bytes match) → object-storage
  metadata row owned by admin → hand-made PROCESSING order → grant → buyer download (bytes match,
  counter 1) → revoke (403 with reason) → restore → second grant no-op → manual grant on a
  digital-only order flips it to DELIVERED. Plain user on someone else's order: list/download/
  grant/upload all 403, anonymous 401. Digital-only checkout `start()` without shippingAddress
  passes validation, charges no shipping, taxes at billing, writes `checkout.digitalOnly=true`,
  creates the PayPal order. Note: the H2 file at the repo root was a fresh DB (only admin + seeded
  roles) — test rows left in place: category "Digital Goods", product "Digital Test Ebook"
  (EBOOK-PDF, DIGITAL, one sample.txt asset), order VEN-DIGI01, user buyer2/buyer2pass.
- [x] *(moved to [manager-checklist-2.md](manager-checklist-2.md))* **Browser round**: variant editor Digital files tab, order editor Digital downloads panel,
  test-shop purchase through PayPal sandbox → Downloads panel; refund via webhook → revoked; a
  default SMTP provider + `VENZORA_STOREFRONT_URL` → buyer mail. For S3 set `OBJECT_STORAGE_TYPE`
  + `S3_*` (see application-local.yml comment); default `db` storage works out of the box.

---

## 18. Shipping rules v2 + shipping data (2026-09-04) — built & live-verified

- [x] **Catalog / address data**: packaged `weightGrams` + `lengthMm/widthMm/heightMm` on Product
  (defaults) and ProductVariant (override, 0/null = inherit, `effective*` read-only), variant
  `shipsSeparately`; customs on Product (`customsDescription, hsCode, countryOfOrigin, hazmat,
  declaredValue`); Address `phone, company, residential`. Old `ProductVariant.weight` removed.
- [x] **Backend**: `ShippingRule` v2 (name-unique methods; location matchers + aliases via shared
  `LocationMatching`; product matchers via `ProductMatching` — every physical line must match;
  `originWarehouseId` hook; strategy FLAT / WEIGHT_TIERED / PRICE_TIERED / ITEM_TIERED / PER_ITEM /
  CARRIER_API with tiers + overage; free-above / handling / min / max; ETA days; carrier code).
  `ShippingRateStrategy` beans per strategy + `CarrierRateProvider` interface (none registered →
  rule reported unavailable). `ShippingCalculator.quote` (physical lines only, ranking, bootstrap
  free when no rules). Endpoints: `POST /orders/shipping-quote` (buyer), `POST /shipping/rules/quote`
  (admin test pad). Checkout honours `shippingRuleId`, refuses no-match / wrong choice, snapshots
  `shipping.*` metadata. Validation on POST/PUT. 6 calculator tests; 21 tests green.
- [x] **Manager**: shipping method editor (dynamic form + strategy-specific Pricing section with tier
  table and overage, aliases, product pickers, specificity readout); list sorted like checkout with
  a server-side quote test pad (variant lines + address + currency, breakdown per option); product
  and variant editors pick up the new fields; checkout in the test shop quotes options as radios
  (recommended preselected), shows the cost, sends the choice. Zero-warning build.
- [x] **Live-verified over HTTP**: mug 300 g product default, XL override 350 g, effective values
  echoed; rules US Standard (weight tiers, aliases, free ≥ 100), Worldwide Economy (per item), UPS
  placeholder (CARRIER_API → unavailable); invalid tiered rule → 400; admin quote 3 × XL to
  "United States" = 7.50 recommended / 13.50 economy, DE = economy only; buyer quote + checkout
  choosing Economy → shippingCost 12.00, full `shipping.*` snapshot, phone/residential persisted;
  Worldwide off + DE → "No shipping method covers this address"; US rule on DE → refused.
  Dev DB note: old `shipping_rule` table dropped by hand (schema changed); test rows left in place.
- [x] *(moved to [manager-checklist-2.md](manager-checklist-2.md))* **Browser round**: editor tier table UX, test pad, checkout radios through PayPal sandbox.
- [x] *(moved to [manager-checklist-2.md](manager-checklist-2.md))* **Next (agreed)**: warehouses (Warehouse entity + address, InventoryLevel per variant × warehouse,
  movement/order-item/shipment warehouse, single-warehouse allocation, per-group quotes using the
  `originWarehouseId` hook); then a first `CarrierRateProvider`.

---

## 19. Warehouses & carriers (2026-09-10) — built & live-verified

- [x] **Backend**: `Warehouse` (address = ship-from, single default, seeded "Main" + migration of
  existing variant stock), `InventoryLevel` (variant × warehouse; `ProductVariant.inventoryLevels`
  read-only, `stockQuantity` = sum), `StockMovement.warehouse` + `warehouseQuantityAfter` (default
  warehouse when unnamed; per-warehouse negative guard), `InventoryService.allocate` (one warehouse
  if it covers all, prefer destination country → default → priority; else split; shortfall flagged)
  used by both capture paths (`OrderFulfillmentItem.warehouseId`, `allocation.*` metadata), restock
  into the item's warehouse, shipping quotes use dry-run allocation as origin. `Carrier` (+ service
  levels, credentials, tracking template, `integrationType`) with `CarrierRateProvider` keyed by
  integration type; `ShippingRule.carrierId` replaces the free-text carrier code; `Shipment`
  `warehouseId/carrierId/carrierServiceCode`. Endpoints: `/warehouses` (inventory), `/carriers`
  (new `shipping` resource, SHIPPING_ADMIN), `/inventory/variants/{id}`, `/inventory/warehouses/{id}`.
  api.md §7.10/7.12a/7.13. 25 tests green (4 new allocation/level tests).
- [x] **Manager**: Inventory → Warehouses (list + editor with ship-from address form and "stock held
  here"), Rules → Carriers (list + editor with credentials show/hide and a service-level table),
  variant editor "stock by warehouse" table with per-warehouse Adjust, quick-stock dialog warehouse
  picker with per-warehouse projection, stock page per-warehouse breakdown, shipping rule editor
  origin-warehouse + carrier/service pickers, shipment editor warehouse/carrier/service pickers
  (carrier fills the display name + tracking link). `shipping` in the permission catalog.
  Zero-warning build.
- [x] **Live-verified**: seed created Main and moved 2 balances; Berlin (DE) created; +20 into Berlin
  / −5 default → per-warehouse and total figures on the movement; over-draw → 400 naming the
  warehouse; inventory endpoints; UPS carrier with services; CARRIER_API rule bound → quote shows
  "No rate integration registered for 'none' (carrier UPS)"; quote to DE picks Berlin as origin.
  Dev DB note: new tables only (no drops needed).
- [x] **Follow-up (user: "is Stock Quantity the same as stock on hand? remove it from the variant")**:
  yes, same number — and a product save was wiping the cached total. The stored column is GONE:
  `ProductVariant` keeps only read-only `inventoryLevels[]` and a derived `getStockQuantity()`
  (Σ levels) on the wire; product/variant/patch responses are refreshed after save (`reloadFresh`)
  so they carry the derived total and levels; the seeder only guarantees the default warehouse;
  the Manager shows the total disabled with the per-warehouse table underneath. Dev DB:
  `product_variant.stock_quantity` dropped. Verified: PUT with `stockQuantity: 999` ignored,
  movements stamp both figures, checkout pre-check still refuses an over-order.
- [x] *(moved to [manager-checklist-2.md](manager-checklist-2.md))* **Browser round**: warehouse/carrier editors, variant stock table + dialog, shipment pickers,
  a real PayPal capture to see `allocation.*` on the order.
- [x] *(moved to [manager-checklist-2.md](manager-checklist-2.md))* **Next**: first `CarrierRateProvider` (e.g. EasyPost) reading the carrier's credentials and the
  spec's origin warehouse address; label purchase on shipments; stock TRANSFER between warehouses as
  a paired movement.

---

## 20. Scan codes — barcode / QR on variants (2026-09-10) — built & live-verified

- [x] **Design (agreed)**: main code = the variant id (UUIDv7; unique, immutable, auto on create),
  printed as QR by default or Code 128; aliases = any outside code as text + symbology, own entity
  `ProductVariantScanCode`, may repeat across variants, not on one variant, never one of our ids.
- [x] **Backend**: entity + `ScanCodeService` (add/patch/delete, `lookup` MAIN-first then active
  aliases) + `ScanCodeController` (`/product/variants/by-code/{code}`, `/{id}/scan-codes` CRUD,
  catalog authorities); `ProductVariant.scanCodes` read-only. api.md §7.12b. 3 unit tests.
- [x] **Manager**: variant editor **Codes** tab (QR / Code 128 preview of the id, print N labels via a
  print window, copy id, alias add/toggle/print/remove); Inventory → Stock gets a scan box (scanner
  types + Enter → variant editor, or a pick list when an alias matches several). New deps
  `qrcode` + `jsbarcode` (client-side rendering; backend stays data-only).
- [x] **Live-verified**: MAIN lookup returns variant + product name + price + stock; alias added on two
  variants; duplicate-on-variant and own-id refused; alias lookup returns both; deactivate drops it
  from lookup; delete 204; unknown → NONE.
- [x] *(moved to [manager-checklist-2.md](manager-checklist-2.md))* **Browser round**: Codes tab rendering and the print sheet, scan box with a real scanner.
