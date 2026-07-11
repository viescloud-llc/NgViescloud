# Venzora Manager — Implementation Checklist

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
- [ ] Drag-to-reparent (nice-to-have, deferred per intent § 5.2)
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
- [~] **Variant detail panel**: DEFERRED — the current variants table only exposes scalar fields (attributeValues + medias are `@MatInputHide` on `ProductVariant`, so they don't render inline). Per-variant attribute overrides and per-variant media aren't editable after generation. Follow-up: build a `VariantDetailDialog` that renders `<app-attribute-value-field>` per variant-level attribute + media rows.
- [x] **Media section**: per-product gallery via dynamic-form rows per `ProductMedia`. `isPrimary` toggle handler clears the flag on all other rows on activation (server doesn't enforce uniqueness).
- [x] Save issues a PUT (or POST for new) with the full product graph via the inherited `ViesRestApi.save()`. Delete uses `openCascadeDeleteConfirm` with three dep counts (variants, attributes, media).
- [~] Spinner: `RxJSUtils.waitLoadingDialog()` wraps the fetch/save calls via the base class. Optimistic UI for cheap toggles isn't wired yet — deferred to a polish pass.

**Model change made along the way**: added `@MatInputHide()` + `@MatTableHide()` to `Product.tags` (was rendering as inline sub-form, but the product editor uses a dedicated multi-select from the Tag pool — cleaner UX).

---

## 4. Orders & fulfillment

Intent § 5.4. Now means `OrderFulfillment`, and payment status lives on `CheckoutOrder` in the library.

- [ ] `OrderListComponent` — queue at `/commerce/orders` with `FulfillmentStatus` filters + `orderNumber` search
- [ ] `OrderComponent` — detail with status transitions (`PENDING` → `PROCESSING` → `SHIPPED` → `DELIVERED`)
- [ ] **Payment-side fetch** — resolve `OrderFulfillment.checkoutOrderId` against library `GET /api/v1/checkout/orders/{id}` for `CheckoutOrder.status`, `amountTotal`, `amountRefunded`, transaction audit log
- [ ] **Order metadata viewer** (intent § 5.11):
  - [ ] System keys (`checkout.*`, `tax.*`, `discount.*`, `shipping.*`) rendered as read-only audit panel
  - [ ] `notes.*` keys editable list grouped by topic; "add note" UI to create new `notes.<topic>` entries
- [ ] Trigger shipment creation from the order detail
- [ ] Trigger return creation from the order detail
- [!] Webhook → fulfillment status listener (no backend yet — admins manually flip status after PayPal-dashboard events; see § 11)

---

## 5. Returns (RMA)

Intent § 5.5. Now means `ReturnRequest` referencing `OrderFulfillment` + `OrderFulfillmentItem`.

- [ ] `ReturnListComponent` — RMA queue at `/commerce/returns`
- [ ] `ReturnComponent` — review reason, approve/reject, mark shipped/received/refunded, write `adminNotes`, set `refundAmount`
- [ ] On approve + refundable: call library `POST /api/v1/checkout/orders/paypal/{checkoutOrderId}/refund?amount=&reason=`
- [ ] After refund, update `OrderFulfillment.status` to `REFUNDED` / `PARTIALLY_REFUNDED`
- [ ] Lifecycle guard: status transitions not enforced server-side, so the UI must guard

---

## 6. Shipments

Intent § 5.4 (implicitly).

- [ ] `ShipmentListComponent` — active shipments + tracking at `/commerce/shipments`
- [ ] `ShipmentComponent` — `trackingNumber` (unique), `carrier` (free text), `ShipmentStatus`, both delivery dates (BOTH non-nullable — UI must supply both on create)

---

## 7. Discounts

Intent § 5.7.

- [ ] `DiscountListComponent` at `/commerce/discounts`
- [ ] `DiscountComponent` — `discountType` selector switches the meaning of `discountValue`; form adapts (borrow the polymorphic pattern)
- [ ] `validFrom` / `validTo` via `<datetime-picker>` (TBD — relies on `DateTimeUtil`)
- [ ] `currentUses` shown read-only (server-bumped at checkout)
- [ ] No client-side validation logic — orchestrator enforces at checkout

---

## 8. Commerce rules

### 8.1 Shipping rules

Intent § 5.8.1.

- [ ] `ShippingRuleListComponent` at `/rules/shipping` — one row per currency
- [ ] Add-rule flow: currency picker excludes currencies that already have a rule (DB-unique constraint)
- [ ] Edit `flatFee`, `freeAboveAmount` (nullable disables threshold), `description`, `active`

### 8.2 Tax rules

Intent § 5.8.2. The most flexible piece.

- [ ] `TaxRuleListComponent` at `/rules/tax` sorted by `(specificity DESC, priority DESC)` — the eval order
- [ ] `TaxRuleComponent` — `name`, `rate`, four matcher fields each with "match any" toggle that nulls the field
- [ ] **Export button** → `GET /api/v1/tax/rules/export` → download JSON
- [ ] **Import modal** — file picker → `append`/`replace` toggle → `POST /api/v1/tax/rules/import?mode=`
  - [ ] On `replace`: confirmation showing the count of existing rules that will be deleted
- [ ] **Test pad** (nice-to-have) — type a shipping address, see which rule matches and the resulting tax (client-side reproduction of the algorithm)

---

## 9. Inventory

Intent § 5.6.

- [ ] `StockComponent` at `/inventory/stock` — per-variant stock view, filter by category/product, "low stock" sub-view
- [ ] Adjustment flow inserts new `StockMovement` (type `ADJUSTMENT`) — **never PATCH `quantityAfter`** (denormalized)
- [ ] `StockMovementListComponent` at `/inventory/movements` — audit log, filter by variant/date/type

---

## 10. Reviews + reports + polish

### 10.1 Reviews moderation

Intent § 5.9.

- [ ] `ReviewListComponent` at `/reviews` — plain table, rating sort, status filter, delete control
- [!] Public review write needs backend change (Review should extend `TrackedTimeStampUserAccess` or use the new `/me/reviews` endpoint — see § 11)

### 10.2 Reports & analytics

Intent § 5.10. Hits `/api/v1/reports/*` (10 endpoints).

- [ ] `<ReportPeriodPicker>` shared component — every report takes the same `from`/`to`
- [ ] Service that fans out the request set per period
- [ ] **Tax filing** *(highest value)* — `/reports/tax`, table grouped by jurisdiction, CSV download. Caption that `matchingRule` is informational only; historical record lives in `OrderFulfillment.metadata.tax.*`
- [ ] **Sales dashboard** — KPI cards (`/sales/summary`), line/bar chart (`/sales/timeseries?bucket=day`), product/category leaderboards, geography map
- [ ] **Order pipeline** donut from `/reports/orders/status`
- [ ] **Refunds + customers** cards
- [ ] **Raw export** — stitch paginated `/reports/orders` into a CSV

### 10.3 Polish

- [ ] Density-optimized tables across the app
- [ ] Keyboard shortcuts (navigate list rows, save form, esc to close detail panel)
- [ ] AI-assisted features (auto-tag, auto-categorize) — defer per intent § 12

---

## 11. Backend gaps tracking

These block specific Manager features. Track them so we don't accidentally try to build around them.

- [!] **Variant generator** — `POST /api/v1/products/{id}/generate-variants` would replace the loop-and-POST approach in the product editor (blocks § 3 generator efficiency)
- [!] **Media uploader** — `ProductMedia.url` is opaque; admins paste URLs today (blocks § 3 media UX)
- [!] **Webhook → fulfillment listener** — without it, admins manually flip `OrderFulfillment.status` after PayPal-dashboard refunds/chargebacks (blocks § 4 automation)
- [!] **Login / refresh-token paths** — confirm with backend before wiring the auth shell (blocks § 0.1 final wiring)
- [!] **Public review write** — `Review` doesn't extend `UserAccess`. Either model migration + user-scoped controller, or use the new `/me/reviews` endpoint (blocks § 10.1 if shoppers should self-write)

---

## Notes

- **Source of truth** for entity shapes: `api.md` § 3–10 (in the backend repo). Memory pointers: [project_venzora_backend_contract] and [project_venzora_api_contract].
- **Source of truth** for intent: `frontend-manager.md` (in the backend repo). Memory pointer: [project_venzora_manager_intent].
- **Library-first preference**: when introducing new primitives (the three reusables, error mapper, cascade-delete helper), put them in `src/lib/` if they'd benefit other Angular projects, not in `src/app/`.
- **No NgRx unless really needed** (intent § 2). Service + signals is the default.
