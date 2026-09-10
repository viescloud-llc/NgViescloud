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

## 1. Customers section *(highest priority — no way to look at a customer today)*

Backend already has `UserInfoController`, `UserAddressController`, `/me/*` self-service, and
`GET /reports/customers/summary`. Mostly Manager work plus two read endpoints.

- [ ] **Backend** `GET /api/v1/customers` (paged, search by name/email, `customers:read`) and
  `GET /api/v1/customers/{userId}` returning profile (User + UserInfo), addresses, order count,
  lifetime value, last order date, open returns, review count.
- [ ] **Backend** `GET /api/v1/customers/{userId}/orders` (paged) — reuse `OrderFulfillmentService`
  with `orders:manage`.
- [ ] **Manager** Commerce → Customers list (search, sort by LTV / last order) and a customer page:
  profile, addresses (read-only + "edit" via UserAddress), order history table linking to the order
  editor, returns, reviews, notes (`notes.*` on UserInfo or a small `CustomerNote` entity).
- [ ] **Manager** From the order editor, the buyer id becomes a link to the customer page.
- [ ] `customers` already exists in the permission catalog (`customers:*`); seed `customers:read` onto
  FINANCE_ADMIN and SHIPPING_ADMIN.

## 2. Money actions in the order editor

The lib exposes admin-gated capture / refund / cancel on `/api/v1/checkout/orders/{id}/…`; the
Manager has no buttons for them (staff refund in the PayPal dashboard today, the webhook syncs).

- [ ] **Manager** Payment tab: **Refund** (full / partial amount + reason) → lib refund endpoint;
  **Capture** for an approved-but-uncaptured order; **Cancel** for PENDING. Confirm dialogs that
  spell out the money movement. Gate buttons on `checkout:refund` / `checkout:capture` / `checkout:cancel`.
- [ ] **Backend** After a refund the existing listener already flips status and revokes digital
  downloads; add `refund.*` metadata (amount, reason, actor, at) via a small `OrderRefundService`
  that wraps the lib call so the order snapshot explains itself.
- [ ] **Returns → refund linkage**: on a return request approved/received, a "Refund this return"
  action pre-fills the amount from the returned lines; write `return.refundedAt` on the request.
- [ ] Order editor: partial-refund state shows refunded vs charged per line where the payment
  record allows.

## 3. Transactional email

`DigitalDeliveryMailer` + SMTP settings are the pattern (default provider, background thread,
never blocks the capture). Generalise it.

- [ ] **Backend** `TransactionalMailer` with a small template set (HTML strings for now, no engine):
  order confirmation (on capture), shipped (Shipment → SHIPPED, tracking link from the carrier's
  template), delivered, refund issued, return request received / approved / rejected. Each is a
  listener on the existing events/status changes; each writes `mail.<event>At` metadata.
- [ ] **Backend** `venzora.mail.*` per-event toggles; `venzora.store-name` / `storefront-url` already
  exist; add `venzora.mail.reply-to`.
- [ ] **Manager** Settings → Email: per-event on/off, "send test" for each template to the admin's
  address, preview of the rendered HTML.
- [ ] Buyer marketing opt-in stays separate; transactional mail always sends.

## 4. Server-side lists, search and pagination

Every list page loads everything and filters in the browser.

- [ ] **Backend** Paged + filtered read endpoints for orders (status, date range, customer, order
  number), products (name/SKU/scan-code text search, status, category), returns, reviews, stock
  movements (variant, warehouse, type, date). Use the lib's paged `getAll` (`PageResponse<T>`) and
  `POST /matches`-style filters where needed.
- [ ] **Manager** `app-mat-table` pagination wired to server paging for orders, products, movements;
  search boxes debounce and hit the server; keep client-side filtering for small lists (rules,
  warehouses, carriers).
- [ ] Product search also matches scan-code aliases (join through `product_variant_scan_codes`).

## 5. Audit trail

- [ ] **Backend** `ChangeLog` entity (entityType, entityId, action, actorUserId, at, diff JSON) written
  from a generic hook in `VenzoraService` / `VenzoraCustomUserAccessService` for POST/PUT/PATCH/DELETE
  on products, variants, discounts, shipping/tax rules, carriers, warehouses, roles, users. Money and
  stock already have their own ledgers; link them by reference.
- [ ] **Backend** `GET /api/v1/audit?entityType=&entityId=` (`audit:read`, seeded onto SYSTEM_ADMIN).
- [ ] **Manager** "History" tab on product, variant, order, discount and rule editors; System → Audit
  log page with filters.

## 6. Stock operations

- [ ] **Backend** Stock TRANSFER as a paired movement (out of A, into B, same reference):
  `POST /api/v1/inventory/transfers {variantId, fromWarehouseId, toWarehouseId, quantity, reason}`.
- [ ] **Backend** Low-stock threshold per variant (or per product default) + `GET /inventory/low-stock`;
  optional daily email to inventory admins via §3.
- [ ] **Backend** `Supplier` + `PurchaseOrder` (lines: variant, qty ordered, qty received, cost) —
  receiving a PO writes PURCHASE movements into the chosen warehouse; scan-code aliases get a
  `supplierId` so supplier barcodes are first-class.
- [ ] **Manager** Inventory → Transfers, Low stock, Suppliers, Purchase orders (receive with a scanner:
  scan → +1 on the matching PO line).

## 7. Bulk operations and import / export

- [ ] **Backend** CSV export/import for products + variants (upsert by SKU), stock levels (by SKU +
  warehouse code, writes ADJUSTMENT movements), discounts, shipping rules (same shape as the tax-rule
  import/export that exists).
- [ ] **Backend** Bulk endpoints: set status / adjust price by % or amount / add tags / move category
  for a list of product ids (`catalog:update`), with a dry-run flag returning what would change.
- [ ] **Manager** Multi-select on the product list with a bulk-action bar; Import/Export buttons on
  products, stock, discounts, shipping rules with the tax-rule dialog pattern (append/replace,
  confirm counts).

## 8. Manual orders and POS

- [ ] **Backend** `POST /api/v1/orders/manual` (`orders:create`): staff builds an order for a customer
  (or a walk-in) from variant ids + quantities, chooses warehouse and shipping method (or "collected"),
  payment recorded as CASH / CARD_TERMINAL / OTHER with a reference — no PayPal round-trip; the capture
  path is reused so stock, digital entitlements, allocation and emails behave identically.
- [ ] **Backend** `PaymentMethod` on the order snapshot; reports split by method.
- [ ] **Manager** Commerce → New order: customer picker (or walk-in), scan box to add lines (uses
  `by-code`), quantities, discount code, shipping choice via the quote endpoint, record payment,
  print receipt (label-print pattern).
- [ ] **POS mode** (later): a stripped full-screen route of the same page for a counter tablet.

## 9. Store settings page

- [ ] **Backend** `StoreSettings` singleton entity (store name, storefront URL, default currency,
  support email, mail reply-to, logo object-storage id, low-stock default threshold, weight/dimension
  display units) with `GET/PUT /api/v1/store-settings` (`settings:*`); services read it instead of
  `venzora.*` properties (properties remain bootstrap defaults).
- [ ] **Manager** Settings → Store: the form + logo upload (object storage, like digital assets).

## 10. New reports and an operational dashboard

- [ ] Stock valuation by warehouse (Σ qty × cost — needs a `cost` on variant/product; add it).
- [ ] Discount performance (uses, revenue, discount given, per code and per period).
- [ ] Shipping charged vs shipping cost (once a carrier provider reports cost).
- [ ] Returns rate by product / reason.
- [ ] **Manager** Home dashboard: today's orders, awaiting shipment, pending returns, low stock, unpaid
  PENDING orders older than 1 h — each tile links to the filtered list.

## 11. Technical items

- [ ] `@Version` on `InventoryLevel` (optimistic lock) so simultaneous captures on the last unit fail
  cleanly instead of racing; retry once in `complete()`.
- [ ] Encryption at rest for SMTP passwords and carrier `apiKey/apiSecret` in the lib
  (`@Convert(EncryptedStringConverter)` keyed by an env secret) — lib bump + deploy.
- [ ] Integration tests for checkout: start → capture (complete + webhook) → refund → restock, against
  H2 with a fake `CheckoutProviderRegistry`; and allocation across two warehouses.
- [ ] Manager e2e smoke (Playwright) for login, product create, order workflow, so browser rounds stop
  being manual.
- [ ] First `CarrierRateProvider` (EasyPost or a direct UPS/FedEx client) reading the carrier's
  credentials and the origin warehouse address; label purchase on shipments; tracking webhook →
  shipment status listener (mirror of the PayPal webhook pattern).
- [ ] Media: bulk image upload and drag-reorder across a product's variants.

---

## Suggested order

1. §1 Customers → 2. §2 Money actions → 3. §3 Transactional email → 4. §4 Server-side lists →
5. §5 Audit → 6. §8 Manual orders (unlocks the POS) → 7. §6 Stock ops → 8. §7 Bulk/import →
9. §9 Store settings → 10. §10 Reports/dashboard → §11 as items become blocking.
