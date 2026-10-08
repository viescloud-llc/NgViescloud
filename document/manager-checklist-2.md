# Venzora Manager — Implementation Checklist 2

> Second wave, opened 2026-09-10 after the system review. Ordered by priority: §1–§4 turn the
> Manager from a configuration tool into something staff run a store from all day; §5–§10 are
> operational depth; §11 is technical debt. Same legend as checklist 1:
> `[ ]` not started · `[~]` partial · `[x]` done · `[!]` blocked. When an item lands, leave it
> checked with the file paths. Prior work and its locations: [manager-checklist.md](manager-checklist.md).

**Ground rules that carry over**: lib → deploy → Venzora → Manager ordering when the shared lib changes;
`npm run build` must be zero-warning before a milestone is done; every new endpoint declares its
`@Requires*` gate (the architecture test fails otherwise); money-moving actions are admin-only;
document new endpoints in `Venzora/document/api.md`.

---

## 0. Carried over from checklist 1 (verification rounds)

- [ ] AI-assisted features (auto-tag, auto-categorize) — defer per intent § 12
- [ ] **Testing round**: log in as a seeded section admin (create a user in only e.g.
- [ ] **Testing round**: restart backend (VS Code Java reload first — lib bumped to 6.5.0); as admin
- [ ] **Testing round** (needs backend restart — new columns/join tables are created by ddl-auto): rule
- [ ] **Testing round** (restart backend — new join tables): discount with maxUses 0 applies repeatedly
- [ ] **Testing round** (restart backend): add a Gmail/app-password provider, send a test email,
- [ ] **Browser round**: variant editor Digital files tab, order editor Digital downloads panel,
- [ ] **Browser round**: editor tier table UX, test pad, checkout radios through PayPal sandbox.
- [ ] **Next (agreed)**: warehouses (Warehouse entity + address, InventoryLevel per variant × warehouse,
- [ ] **Browser round**: warehouse/carrier editors, variant stock table + dialog, shipment pickers,
- [ ] **Next**: first `CarrierRateProvider` (e.g. EasyPost) reading the carrier's credentials and the
- [ ] **Browser round**: Codes tab rendering and the print sheet, scan box with a real scanner.

---

## 1. Customers section ✅ *(2026-09-10)*

- [x] **Backend** `GET /api/v1/customers` (search, page, size — `customers:read`),
  `GET /customers/{userId}` (summary + UserInfo + addresses + returns + reviews + notes),
  `GET /customers/{userId}/orders`, `POST/DELETE /customers/{userId}/notes` (`customers:update`).
  Files: `model/customer/{CustomerSummary,CustomerDetail,CustomerPage,CustomerNote}`,
  `service/customer/CustomerService`, `controller/customer/CustomerController`,
  `dao/customer/CustomerNoteDao`; `findAllByUserId` on order/return/review DAOs. api.md §7.14.
  Seeder: FINANCE_ADMIN `customers:*`, SHIPPING_ADMIN `customers:read`.
- [x] **Manager** Commerce → Customers: [customer-list](../src/app/commerce/customers/customer-list/)
  (server search, paging, LTV per currency, last order, open returns) and
  [customer](../src/app/commerce/customers/customer/) page (KPI tiles, profile, addresses, orders →
  order editor, returns → return editor, reviews, staff notes add/delete gated on `customers:update`).
  Model `shared/model/customer.model.ts`, service `shared/service/customer/`.
- [x] **Manager** Order editor banner: "View customer" (gated `customers:read`).
- [x] **Live-verified**: list (admin: 1 paid order, LTV {USD: 10}; buyer2: none), case-insensitive
  search, detail, orders newest-first, note add (author stamped) / delete / blank → 400, plain user
  → 403, unknown id → 404. Zero-warning build.
- [ ] Later: edit addresses / profile from the page (today: Settings → Users), registration date
  (the lib User carries no timestamp).

## 2. Money actions in the order editor ✅ *(2026-09-10)*

- [x] **Backend** `service/checkout/OrderPaymentService` + `controller/checkout/OrderPaymentController`
  (`GET/POST /orders/{id}/payment[/refund|capture|cancel|sync]`, each behind `checkout:read/refund/
  capture/cancel/sync`), `controller/checkout/ReturnRefundController` (`POST /returns/{id}/refund`),
  `CheckoutOrchestratorService.completeByStaff` (staff capture, `checkout.capturedBy`). Refunds are
  validated against the lib's refundable amount and snapshotted as `refund.*`; cancel writes
  `cancel.*`; status moves come from the existing webhook listener. api.md §7.15.
- [x] **Manager** Order editor → Payment tab: charged / refunded / refundable tiles, transaction
  list, Refund (amount + reason, empty = all refundable), Capture, Cancel (reason), Sync — each
  gated on its `checkout:*` grant with a confirm dialog that spells out the money movement; the
  order re-hydrates after each action. Return editor: "Issue refund" now calls the one-step server
  endpoint (requires a saved return) instead of the old three-call client chain.
- [x] **Live-verified**: PaymentView on a PENDING order (canCapture/canCancel true, canRefund false);
  refund on uncaptured → 400 with reason; staff capture surfaces the provider error cleanly (sandbox
  order expired); cancel → CANCELLED + `cancel.*` metadata + checkout CANCELLED; second cancel → 400;
  plain user → 403; unknown return → 404. A real refund needs a captured sandbox order (browser
  round). Zero-warning build.
- [ ] Later: per-line refunded-vs-charged (the lib's CheckoutOrder has no per-line refund data).

## 3. Transactional email ✅ *(2026-09-10)*

- [x] **Backend** `service/mail/{TransactionalMailer, MailTemplates, MailSettingsService, MailSamples}`,
  `model/mail/{MailEvent, MailSetting, MailEventSetting}`, `controller/mail/MailSettingsController`
  (`/api/v1/mail/settings|preview|test`, `smtp:*`). Hooks: orchestrator + webhook listener (confirmed,
  delivered for digital-only), listener (refund issued — covers dashboard refunds too), `ShipmentService`
  (shipped / delivered), `OrderFulfillmentService` (order marked DELIVERED), `ReturnRequestService`
  (received / approved / rejected). `DigitalDeliveryMailer` is now a facade over the same mailer.
  Dedup via `mail.*At` order metadata; per-event switches in DB over `venzora.mail.*` properties;
  `reply-to` / `support-email` properties. api.md §7.16.
- [x] **Manager** Settings → Email notifications ([system/mail](../src/app/system/mail/)): per-event
  toggle, subject override with placeholders, preview of the rendered sample, send test to an
  address (defaults to the signed-in admin). Gated `smtp:read/update/send`.
- [x] **Live-verified**: list, toggle, subject override reflected in the preview title, all 8 previews
  render (items table, totals, shipping method), test-send without a provider → 409 with the reason,
  plain user → 403, shipment → SHIPPED triggers the mail path (skipped + logged: no provider).
  Real delivery needs a default SMTP provider (browser round with Settings → SMTP). Zero-warning build.
- [ ] Later: HTML template files / branding (logo from store settings, §9); per-customer opt-out is
  intentionally absent (transactional mail always sends).

## 4. Server-side lists, search and pagination ✅ *(2026-09-10)*

- [x] **Backend** `service/list/ListQueryService` (JPA specifications; dates → UUIDv7 id ranges via
  `util/UuidV7Bounds`, newest-first = `id desc`, allow-listed `sort`), `controller/list/ListSearchController`:
  `GET /orders|products|returns|reviews|stock/movements/search` with `q`, filters, `from/to`, `page`,
  `size` (≤200), `sort`. Product search joins variants and scan-code aliases. DAOs gained
  `JpaSpecificationExecutor`. api.md §7.17. Unit test for the id-range bounds.
- [x] **Manager** `shared/model/list-page.model.ts`, `shared/service/search/search.service.ts`,
  reusable `shared/component/server-pager` (prev / next / per-page). Orders (status, search, date range,
  customer filter via `?customerId=` — linked from the customer page), Products (search incl. barcode
  aliases, status), Returns (status, search) and Stock movements (type, warehouse, search, date range)
  now page on the server with debounced search. Rules, warehouses, carriers stay client-side (small).
- [x] **Live-verified**: orders by status / text / customer / date range / size 1 page 1 sorted by total,
  bad sort → 400; products by name, alias barcode and variant SKU; movements by warehouse and
  type+text; returns / reviews 200; plain user → 403. Zero-warning build.
- [ ] Later: the Stock overview page still loads all products (it aggregates per variant); reviews
  page still client-side.

## 5. Audit trail ✅ *(2026-09-10)*

- [x] **Backend** `model/audit/ChangeLog`, `service/audit/{AuditService, AuditedServiceSupport}`,
  `controller/audit/AuditController` (`GET /audit`, `/audit/entity-types`, `audit:read` seeded on
  SYSTEM_ADMIN). Generic hooks in `VenzoraService` + `VenzoraCustomUserAccessService` (before-snapshot in
  `validatingBeforePut/Patch`, write in `processing*Output`, delete snapshot in `processingDeleteInput`);
  property-wise snapshots with nested entities compacted to id+label; secrets masked; no-op updates
  skipped. Opt-outs: StockMovement, Cart, CartItem, WishProduct. Domain actions logged from
  `OrderPaymentService` (REFUND/CAPTURE/CANCEL), `OrderRestockService` (RESTOCK),
  `DigitalEntitlementService` (REVOKE/RESTORE_DOWNLOAD). api.md §7.18. Diff unit tests.
- [x] **Manager** `shared/component/history-panel` (History with from → to per field, "show older")
  on the product, variant, order, discount, shipping rule, tax rule, carrier and warehouse editors;
  System → Audit log ([system/audit](../src/app/system/audit/)) with entity / action / text / date
  filters, server paging and "Open" links; `audit` in the permission catalog.
- [x] **Live-verified**: product PATCH → UPDATE by admin with `description: a → b`; no-op PUT adds
  nothing; PUT changing price + a variant name → only those fields; carrier CREATE lists set fields
  with `apiKey: ***`; DELETE recorded; stock movements not duplicated; text search; plain user → 403.
- [ ] Later: lib-owned users / groups / roles (needs hooks in vies-spring-utils); retention / purge;
  variants saved through the product PUT are logged on the Product as a compacted list (add / remove
  visible, a field edit inside a variant is not) — the variant editor's own saves go through the
  product too, so per-variant field history needs a ProductService-level nested diff.

## 6. Stock operations ✅ *(2026-09-11)*

- [x] **Backend** Stock TRANSFER as a paired movement (out of A, into B, same `TRF-…` reference, one
  transaction, refused below zero): `POST /api/v1/inventory/transfers {variantId, fromWarehouseId,
  toWarehouseId, quantity, reason?, reference?}` (`inventory:update`).
- [x] **Backend** Low-stock line per variant (`ProductVariant.lowStockThreshold`) → product default
  (`Product.lowStockThreshold`) → store default (`venzora.inventory.low-stock-default`, 5).
  `GET /inventory/low-stock?warehouseId=&includeInactive=` (physical variants at/below the line, per-warehouse
  balances, units on open POs). Daily digest: `MailEvent.LOW_STOCK_DIGEST` (a *staff* event — recipients
  are configured on the mail setting, Settings → Email), cron `venzora.inventory.low-stock-cron`
  (07:00 server time), `POST /inventory/low-stock/digest` sends it now.
- [x] **Backend** `Supplier` (`/api/v1/suppliers`, `inventory:*`; delete refused while POs reference it) +
  `PurchaseOrder` / `PurchaseOrderLine` (`/api/v1/purchase-orders`; DRAFT → ORDERED → PARTIALLY_RECEIVED →
  RECEIVED, CANCELLED; `place`, `receive {lines:{lineId:qty}}` (empty = all outstanding), `receive-scan
  {code, quantity}`, `cancel`, `close` (short-ship), `GET /open`). Receiving writes PURCHASE movements into
  the PO's warehouse referenced by the PO number; received quantities are server-owned. Scan-code aliases
  carry `supplierId` so a supplier's carton barcode receives straight onto the right PO line. Audit actions
  `TRANSFER`, `PO_PLACED`, `PO_RECEIVED`, `PO_CANCELLED`, `PO_CLOSED`.
- [x] **Manager** Inventory → Transfers (scan / search a variant, from → to, quantity, recent transfers),
  Low stock (warehouse filter, on-order column, "Add stock…" via the quick-stock dialog, "Send digest now"),
  Suppliers (list + editor with address and open POs), Purchase orders (list with status filter; editor
  with scan/search line entry, place, receive per line / everything / **scanner +1 per scan**, close short,
  cancel, history). Variant + product editors got the low-stock line; alias codes got a supplier select;
  Settings → Email shows staff recipients for the digest.

## 7. Bulk operations and import / export ✅ *(2026-09-11)*

- [x] **Backend** CSV export/import — products + variants (`GET /products/export.csv`, `POST
  /products/import.csv?dryRun=`; one row per variant, products matched by productSku else name, variants
  upserted by SKU, unknown tags created, categories must exist), stock levels (`/stock/export.csv`,
  `/stock/import.csv?mode=set|add&dryRun=&reason=` → ADJUSTMENT movements per SKU × warehouse code),
  discounts (`/discounts/export.csv`, `/discounts/import.csv?dryRun=`; upsert by code). Every import
  validates all rows first and is **all-or-nothing**; the dry run returns the exact plan (`ImportResult`:
  created / updated / unchanged, per-row changes, per-row errors). Shipping methods: JSON export/import
  (`/shipping/rules/export|import?mode=append|replace`) with the tax-rule shape. Audit `CSV_IMPORT`,
  `CSV_STOCK_IMPORT`.
- [x] **Backend** `POST /products/bulk` (`catalog:update`): SET_STATUS / ADJUST_PRICE (percent then
  amount, rounded HALF_UP, variants with NORMAL price mode too) / ADD_TAGS / REMOVE_TAGS / MOVE_CATEGORY
  over up to 500 ids, `dryRun` returns per-product field diffs; audit `BULK_<ACTION>` per product.
- [x] **Manager** Product list: multi-select rows → bulk bar (action + parameters → Preview → Apply
  exactly the previewed diff). Reusable `<app-csv-import-export>` block (Export CSV / Import CSV → server
  dry run → plan table + errors → Apply) on the product list, the stock page (set / add mode) and the
  discount list; shipping list got Export JSON / Import JSON (append / replace) like tax rules.
- Fixed on the way: variant DELETE returned 500 ("fail to delete data") because the EAGER
  cascade-ALL `Product.variants` set re-persisted the row at flush — `ProductVariantService` now unlinks
  from the parent first; every framework field scan (unique checks, examples, relation maps) walked
  static and compiler-synthesized fields (`HUNDRED`, ECJ `$SWITCH_TABLE$…`) and failed the whole POST —
  **vies-spring-utils 6.5.4** skips them (Venzora bumped); lib `<app-mat-table>` emitted the selection
  *before* toggling (count lagged one click) and its row `(mousedown)` navigated on every left press
  (so ticking a checkbox opened the row) — fixed. Note: variants are still created through the product
  editor (nested PUT); a direct `POST /product/variants` has no parent link by design.

## 8. Manual orders and POS ✅ *(2026-09-11)*

- [x] **Backend** `POST /api/v1/orders/manual` + `/manual/preview` (`orders:create`): staff builds an
  order for a customer (or a walk-in name/email/phone) from variant ids + quantities (+ optional unit
  price override), chooses the warehouse and either "collected in store" or an address + shipping
  method (same quote engine as checkout), payment recorded as CASH / CARD_TERMINAL / BANK_TRANSFER /
  OTHER with a reference (cash: tendered → change), or UNPAID (stays PENDING). Priced by the same
  `CheckoutOrchestratorService.price()` as checkout; the capture path (`applyCapture`) is reused so
  stock allocation (preferred warehouse first), SALE movements, digital entitlements and emails behave
  identically. `collected + handedOver` → DELIVERED at once. Walk-in orders have `userId = null`
  (no download entitlements; confirmation mail goes to the walk-in email when given).
- [x] **Backend** `POST /orders/{id}/payment/record` (`checkout:capture` — money, admin side) records
  an offline payment on a PENDING manual order; `PaymentView.canRecordPayment`.
- [x] **Backend** `PaymentMethod` on the order (`ONLINE` for checkout orders); sales summary report
  splits `totalByPaymentMethod` / `ordersByPaymentMethod`. Audit actions `MANUAL_CREATE`,
  `RECORD_PAYMENT`.
- [x] **Manager** Commerce → New order (`commerce/orders/new`, nav + button on the order list):
  customer search or walk-in, scan box (`by-code`) + product search to add lines, qty / price
  overrides, discount code, collected toggle vs address + shipping options from the live preview,
  warehouse select, payment method / reference / cash tendered → change, live totals + stock
  warnings, Create → receipt print (label-print pattern) / open order / new order. Order editor
  Payment tab: manual orders show the offline payment, "Record payment" for PENDING ones, "Print receipt".
- [ ] **POS mode** (later): a stripped full-screen route of the same page for a counter tablet.

## 9. Store settings page ✅ *(2026-09-15)*

- [x] **Backend** `StoreSettings` singleton (fixed id; store name, legal name, storefront URL, default
  currency, support email/phone, mail Reply-To, tax id, store address, logo (object storage), low-stock
  default, weight/dimension display units, receipt footer). `GET/PUT /api/v1/store-settings`
  (`settings:read|update`), `POST/DELETE /store-settings/logo` (multipart, PNG/JPEG/SVG/WebP/GIF ≤ 2 MB),
  `GET /store-settings/logo`; public `GET /api/v1/public/store` (+ `/logo`) for the storefront. The row is
  seeded from `venzora.*` properties on first read and cached; `TransactionalMailer` (name, URL, support,
  Reply-To) and `LowStockService` (default line) read it. Audited (`UPDATE` diff, `LOGO_UPLOADED`,
  `LOGO_REMOVED`). Seeder: SYSTEM_ADMIN gets `settings:*`.
- [x] **Manager** Settings → Store (`system/store`): decorator form + address + logo upload/preview/remove +
  history. App shell loads the public info (and the row for staff with `settings:read`); counter receipts
  print name / legal name / tax id / footer; a new product preselects the default currency.

## 10. New reports and an operational dashboard ✅ *(2026-09-24)*

- [x] Stock valuation by warehouse — `costPrice` added to Product (default) and ProductVariant (override);
  `GET /reports/stock/valuation?warehouseId=` = Σ on-hand × effective cost per warehouse and per line, valued in the
  product's currency, with a "variants without a cost" count.
- [x] Discount performance — `GET /reports/discounts?from&to`: per code (from order metadata `discount.code` /
  `discount.appliedAmount`): orders, revenue, discount given, avg order, discount rate %, current uses / cap.
- [x] Shipping charged vs cost — `GET /reports/shipping?from&to`: per method charged / avg / free-shipping count;
  `carrierCost` and `margin` are null and `carrierCostAvailable=false` until a carrier provider reports cost.
- [x] Returns rate by product / reason — `GET /reports/returns?from&to`: units returned vs sold per product
  (rate %, refunded), requests by reason and by status (cancelled/rejected excluded).
- [x] **Manager** Home dashboard (`/home`, `GET /reports/dashboard`): today's orders + revenue, awaiting shipment
  (+ in transit), pending returns, low stock (+ out of stock), unpaid PENDING older than 1 h, open purchase orders,
  draft products — each tile opens the filtered list (order / return / product lists now honour `?status=` and
  orders `?from=`). Reports page gained the four sections with charts (valuation by warehouse, discount given vs
  revenue per code, returns by reason).

## 11. Technical items ✅ *(2026-09-24)*

- [x] `@Version` on `InventoryLevel` (optimistic lock) so simultaneous captures on the last unit fail
  cleanly instead of racing; retry once in `complete()`. — `InventoryLevel.version`,
  `service/inventory/OptimisticRetry`, `complete()/completeByStaff()` and the webhook→fulfillment
  listener run in a `TransactionTemplate` and retry once; capture goes through the order's own provider.
- [x] Encryption at rest for SMTP passwords and carrier `apiKey/apiSecret` in the lib
  (`@Convert(EncryptedStringConverter)` keyed by an env secret) — lib bump + deploy. — lib **6.5.6**:
  AES key from `VIES_AES_SECRET`/`VIES_AES_SALT` (static dev fallback), `StringAesEncodeConverter`
  tolerant of pre-encryption plaintext, `SmtpProvider.password` converted; Venzora `Carrier.apiKey/apiSecret`
  converted (`AesAtRestTest`).
- [x] Integration tests for checkout: start → capture (complete + webhook) → refund → restock, against
  H2 with a fake `CheckoutProviderRegistry`; and allocation across two warehouses. — `it/CheckoutFlowIT`
  (`@SpringBootTest`, profile `test` = in-memory H2, `FakeCheckoutOrderService` provider "fake"):
  exactly one SALE per line, idempotent second complete, full refund, restock; two-warehouse allocation;
  last-unit contention (one wins, one fails cleanly).
- [x] Manager e2e smoke (Playwright) for login, product create, order workflow, so browser rounds stop
  being manual. — `@playwright/test`, `playwright.config.ts`, `e2e/manager.spec.ts` (+ `helpers.ts`),
  `npm run e2e` against the dev servers (4200/8085, admin/admin; `E2E_BASE_URL`/`E2E_API_URL`/`E2E_USER`/`E2E_PASS`).
- [x] First `CarrierRateProvider` (EasyPost or a direct UPS/FedEx client) reading the carrier's
  credentials and the origin warehouse address; label purchase on shipments; tracking webhook →
  shipment status listener (mirror of the PayPal webhook pattern). — `service/shipping/easypost/*`
  (`EasyPostRateProvider` "easypost", `EasyPostLabelService`, `EasyPostClient` on Spring `RestClient`,
  pure `EasyPostMapper` + `EasyPostMapperTest`), `POST /shipments/{id}/buy-label` (`shipments:update`),
  public `POST /api/v1/public/webhooks/easypost` (HMAC per carrier `apiSecret`), label block on `Shipment`
  + "Buy label" in the shipment editor. **Not verified against the live EasyPost API** — the webhook and
  gates were verified over HTTP, the wire mapping by unit tests; api.md §7.25.
- [x] Media: bulk image upload and drag-reorder across a product's variants. — media gallery "Add files…"
  (multi-select, pending uploads until the parent saves) and CDK drag-to-reorder of thumbnails (sortOrder
  follows the visual order); the same gallery is used by product and variant media.

---

## 12. Storefront customisation and seasonal templates ✅ *(2026-09-22, all four parts)*

Design agreed 2026-09-22. Three layers plus a template system; nothing here touches money, legal text or
business identity (those stay in §9 so applying a template never has side effects).

### 12.1 Appearance (typed settings — an embedded `storefront` section of `StoreSettings`)
- [x] Theme: primary / accent colour, light|dark default, font preset, style preset (corner radius etc.).
- [x] Brand assets: favicon and social share image (object storage, same upload pattern as the logo).
- [x] Header: navigation source (top-level categories | custom links | both), show search / account / cart.
- [x] Footer: link columns, social links, copyright line, show business address / support contact.
- [x] Announcement bar: text, link, colour, on/off, optional start/end so a sale banner switches itself.
- [x] SEO: site title template, default meta description, robots on/off (staging).

### 12.2 Home page layout (content model, JSON sections)
- [x] `StorefrontPage` (slug `home` first; later `about`, landing pages): `sections` = ordered JSON list of
  `{type, settings}`. Section types day one: **hero banner** (image, headline, subtext, button), **featured
  products**, **category grid**, **promo tiles** (2–3 image cards with links), **new arrivals** (automatic),
  **rich text**, **reviews strip**, **newsletter signup**. A new type = a new renderer, never a migration.
- [x] **Product selector** (reused by featured products, promo tiles, later collections): any combination of
  hand-picked product ids + categories + tags + attribute definitions, `match: ANY|ALL` across the automatic
  criteria, pinned picks first, then automatic matches, `sort` (newest | price asc/desc | name | manual),
  `limit`. Resolves ACTIVE products only and silently skips deleted/inactive ones. Same matcher shape as
  discounts and shipping methods (tags / categories / attribute definitions) so admins already know it.
- [x] Draft vs published copy + **Preview** (staff-only token or query flag the storefront honours).
- [x] Legal pages as rich text (terms, privacy, shipping & returns policy) — checkout links to them, the
  return flow shows the returns policy.
- [x] Contact page content: opening hours, map coordinates / embed, uses §9 support contact.

### 12.3 Behaviour toggles (typed, small — `StoreSettings.storefront`)
- [x] Show out-of-stock products, show stock counts, show reviews, allow guest checkout, minimum order
  amount, prices shown incl./excl. tax, default listing sort, products per page.

### 12.4 Templates and scheduling (seasonal looks)
- [x] `StorefrontTemplate`: name, description, **partial overlay** of 12.1 appearance + 12.2 home sections +
  announcement bar + navigation (each part flagged "overridden by this template" or "inherit default"), its
  own draft/published copies, and **its own uploaded images** (object storage, owned by the template so
  deleting it cleans up). Actions: duplicate, "save the current live look as a template", preview.
- [x] `StorefrontSchedule`: template, start, end, priority, enabled — same shape as maintenance windows.
  Active look at any instant = default ⊕ highest-priority enabled window containing *now* (overlaps allowed:
  Black Friday inside the Christmas season). No "apply/undo" state: reverting is automatic. "Activate now" =
  a window with no end; "back to default" ends it. Resolved at read time with a short cache.
- [x] Public `GET /api/v1/public/storefront` returns the resolved appearance + home layout + navigation +
  toggles + announcement in ONE call with a version/ETag; the storefront caches on it and changes on the
  fly without a deploy. Staff preview variant of the same endpoint (template id or draft).
- [x] Manager: Settings → Storefront (tabs: Appearance, Home page, Announcement, Navigation & footer,
  Behaviour, SEO, Legal pages), Templates list + editor + schedule calendar. Section editor for the home
  page with drag-to-reorder and the product selector widget.
- **Page roles (2026-09-22):** `PageRole` (HOME, TERMS, PRIVACY, RETURNS_POLICY, SHIPPING_POLICY, CONTACT, ABOUT,
  FAQ, CUSTOM) replaces `kind`; system-role pages are unique, seeded, undeletable and placed by role in the customer
  frontend (`pagesByRole` in the resolved storefront). Templates carry `affectedRoles` (default HOME + CUSTOM) and
  per-page section overrides; `/public/storefront/pages/{slug}` applies the active template when it affects the role.
  Test shop: `/shop/pages/:slug`.
- **Page bodies (2026-09-22):** a page owns named `PageBody`s (each with draft + published sections); `liveBodyId`
  is what customers see (`make-live` publishes if needed; `take-offline` hides the page). Templates reference a
  body per affected page (`pageBodies {pageId → bodyId}`) instead of copying sections, and publishing a template
  publishes those bodies — so parallel drafts ("Spring launch", "Black Friday") can be prepared and swapped by
  schedule. Manager: body switcher on the page editor (new / copy / save / publish / discard / make live /
  delete / preview), body picker per affected page on the template's Pages tab.
- Implementation notes: appearance / behaviour are JSON columns on `StoreSettings` (`JsonColumn`
  converters, lenient on unknown fields); `StorefrontPage` (draft/published sections, `home` seeded on
  first read), `StorefrontTemplate` (partial overlay flags, draft/published), `StorefrontSchedule`
  (ISO windows, priority), `StorefrontAsset` (object storage, owner SETTINGS/TEMPLATE/PAGE, deleted
  with its owner). `StorefrontResolveService` resolves default ⊕ active template at read time; public
  `GET /api/v1/public/storefront` (+ `/pages/{slug}`, `/assets/{id}`) with ETag. Manager: Settings →
  Storefront (6 tabs), Storefront pages, Templates & schedule, Preview; shared `<app-appearance-editor>`,
  `<app-sections-editor>`, `<app-product-selector>`, `<app-asset-picker>`, `<app-storefront-renderer>`;
  the test shop got `shop/home` rendering the live look. Authority resource `storefront` (CATALOG_ADMIN +
  SYSTEM_ADMIN). Reviews strip / newsletter render placeholders until those features exist.
- Out of scope for now: per-visitor / A/B variants (changes resolution from one active look to one per
  visitor), arbitrary HTML page builder (fixed section types keep the shop consistent and safe).

## Suggested order

1. §1 Customers → 2. §2 Money actions → 3. §3 Transactional email → 4. §4 Server-side lists →
5. §5 Audit → 6. §8 Manual orders (unlocks the POS) → 7. §6 Stock ops → 8. §7 Bulk/import →
9. §9 Store settings → 10. §10 Reports/dashboard ✅ → 11. §12 Storefront customisation ✅ → §11 as items become blocking.

## 13. Follow-ups from the customer client (2026-10-08)

- [ ] **Contact inbox** — the storefront's contact form stores `ContactMessage` rows (`/api/v1/contact-messages`,
  resource `contact`, api.md §7.27). Add a System → Contact inbox page: list (NEW first), read, mark READ / REPLIED,
  reply-by-mail link, delete; badge with the NEW count in the nav.
- [ ] **Email → Contact form message** — the `CONTACT_MESSAGE` staff event appears in Settings → Email; make sure the
  recipients row is editable there (falls back to the store support e-mail when empty).
- [x] **Help page** — `/help` owner's manual (common tasks + every area, searchable, anchored). *(2026-10-08)* Keep it current when workflows change; a Contact inbox section goes in once the inbox page exists.
