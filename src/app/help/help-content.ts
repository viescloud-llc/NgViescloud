import { APP_ROUTES } from '../app.routes';

// The owner's manual, in plain words. Every topic says what the thing is, what
// to do, and — most important — what happens in the shop when you do it.
// Keep it in sync when a workflow changes (see .claude/memory.md §9).

export interface HelpLink { label: string; route: string; }
export interface HelpTopic {
  id: string;
  title: string;
  /** What it is, in one or two short paragraphs (HTML allowed: <p>, <ul>, <strong>, <em>, <code>). */
  what: string;
  /** How to do it, step by step. */
  how?: string[];
  /** What changes for customers, stock, money or staff when you do it. */
  impact?: string[];
  /** Pitfalls and good habits. */
  tips?: string[];
  links?: HelpLink[];
}
export interface HelpSection { id: string; title: string; icon: string; intro: string; topics: HelpTopic[]; }
export interface QuickTask { title: string; icon: string; steps: string[]; links: HelpLink[]; }

const R = APP_ROUTES;

export const QUICK_TASKS: QuickTask[] = [
  {
    title: 'Open the store for the first time', icon: 'rocket_launch',
    steps: [
      'Fill in <strong>System → Store</strong>: name, currency, support e-mail, logo. Customers see these on the storefront and on receipts.',
      'Create at least one <strong>warehouse</strong> with a full address and mark it as the default — it is where stock lives and where counter sales are taxed.',
      'Add a <strong>tax rule</strong> (at least a catch-all) and a <strong>shipping method</strong>, otherwise checkout cannot price an order.',
      'Set up <strong>SMTP / outbound mail</strong> so order confirmations go out.',
      'Add products, put stock in, set them <strong>ACTIVE</strong>, then publish the storefront home page.'
    ],
    links: [{ label: 'Store settings', route: R.systemStore }, { label: 'Warehouses', route: R.inventoryWarehouseList }, { label: 'Tax rules', route: R.rulesTaxList }, { label: 'Shipping rules', route: R.rulesShippingList }]
  },
  {
    title: 'Add a product and start selling it', icon: 'add_box',
    steps: [
      'Catalog → New Product: name, category, currency, base price. Save.',
      'Add variants (size, colour…) — a product sells <em>through its variants</em>; a product with no variant cannot be bought.',
      'Add pictures (first one = primary), weight and box size (used for shipping rates).',
      'Put stock in: Inventory → Stock, adjust the variant in a warehouse.',
      'Set the product status to <strong>ACTIVE</strong>. Only ACTIVE products with an ACTIVE variant appear in the shop; out-of-stock variants show as sold out.'
    ],
    links: [{ label: 'New product', route: R.catalogProductNew }, { label: 'Stock', route: R.inventoryStock }]
  },
  {
    title: 'Handle an order from payment to delivery', icon: 'local_shipping',
    steps: [
      'A paid order arrives as <strong>Processing</strong> (stock has already left the warehouse).',
      'Commerce → Shipments → create a shipment for the order, pick the warehouse and carrier, add the tracking number (or buy a label through EasyPost).',
      'Move the shipment to <strong>Shipped</strong>: the customer gets the "on its way" e-mail and the order becomes Shipped.',
      'When it arrives, mark the shipment <strong>Delivered</strong> (carrier webhooks can do this automatically): the order becomes Delivered and the customer is told.'
    ],
    links: [{ label: 'Orders', route: R.commerceOrderList }, { label: 'Shipments', route: R.commerceShipmentList }]
  },
  {
    title: 'Deal with a return and a refund', icon: 'assignment_return',
    steps: [
      'The customer files the return from their order page (or you file it for them from the order).',
      'Commerce → Returns: <strong>Approve</strong> (the customer gets instructions) or <strong>Reject</strong>.',
      'When the parcel is back: mark <strong>Received</strong> / <strong>Inspecting</strong>, then <strong>Issue refund</strong> — the default amount is what the customer paid for the returned units; "whole remaining balance" is a separate, explicit choice.',
      'Put the goods back on the shelf with <strong>Restock</strong> on the order (a RETURN stock movement).'
    ],
    links: [{ label: 'Returns', route: R.commerceReturnList }]
  },
  {
    title: 'Receive stock from a supplier', icon: 'inventory',
    steps: [
      'Inventory → Suppliers: create the supplier once.',
      'Inventory → Purchase Orders → new: supplier, warehouse, lines (variant + quantity + unit cost). Save as DRAFT, then <strong>Place</strong>.',
      'When the delivery arrives, <strong>Receive</strong> the quantities (or scan the cartons): every received unit is a PURCHASE movement into that warehouse.',
      'Partial deliveries are fine — the order stays <strong>Partially received</strong> until the last unit.'
    ],
    links: [{ label: 'Purchase orders', route: R.inventoryPurchaseOrderList }, { label: 'Suppliers', route: R.inventorySupplierList }]
  },
  {
    title: 'Sell at the counter (POS)', icon: 'point_of_sale',
    steps: [
      'Commerce → New order. Pick a customer or type a walk-in name.',
      'Scan the product\'s code or search it; set quantities. The totals preview comes from the server (tax at the warehouse address for collected sales).',
      'Choose CASH (enter the amount tendered — change is calculated; a short payment is refused), CARD or UNPAID.',
      '"Collected in store" + paid = the order is delivered on the spot and stock leaves immediately. Print the receipt.'
    ],
    links: [{ label: 'New order', route: R.commerceOrderNew }]
  },
  {
    title: 'Put a seasonal look on the storefront', icon: 'auto_awesome',
    steps: [
      'System → Templates & schedule → new template: pick the colours, announcement and home sections it overrides.',
      'Give it the page bodies it should show (e.g. a "Christmas" home body) and <strong>Publish</strong> the template.',
      'Either <strong>Activate now</strong>, or add a <strong>schedule window</strong> (start/end). When the window ends the storefront goes back to the default look by itself.',
      'Check it with <strong>Preview</strong> before the date — customers only see published content.'
    ],
    links: [{ label: 'Templates & schedule', route: R.systemStorefrontTemplates }, { label: 'Storefront', route: R.systemStorefront }]
  },
  {
    title: 'Give a colleague access', icon: 'manage_accounts',
    steps: [
      'Settings → Users: create the user (or let them register on the storefront and find them there).',
      'Settings → Roles & permissions: pick a seeded role (CATALOG_ADMIN, INVENTORY_ADMIN, SHIPPING_ADMIN, FINANCE_ADMIN, SYSTEM_ADMIN) or make your own.',
      'Assign the role to the user. Money actions (refund, capture, cancel) need the <code>checkout:*</code> permissions explicitly — no other role implies them.',
      'Use <strong>Effective permissions</strong> on the user to see exactly what they can do, and the <strong>Audit log</strong> to see what they did.'
    ],
    links: [{ label: 'Users', route: R.usersSetting }, { label: 'Roles & permissions', route: R.rolesSetting }]
  }
];

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'start', title: 'How the system fits together', icon: 'map',
    intro: 'Two applications share one backend: this <strong>Manager</strong> (the back office, for you and your staff) and the <strong>storefront</strong> (the shop your customers use). Everything you change here shows up in the shop — some things immediately, some only when you publish.',
    topics: [
      {
        id: 'start-dashboard', title: 'The home dashboard',
        what: '<p>The home page shows today\'s numbers: orders and revenue (net of refunds), orders waiting to be shipped, pending returns, low-stock and out-of-stock variants, orders unpaid for more than an hour, open purchase orders and draft products. Each tile opens the matching filtered list.</p>',
        tips: ['"Awaiting shipment" counts every <em>Processing</em> order — it only goes down when you ship.', 'A dashboard needs the <code>reports:read</code> permission; staff without it see a welcome message instead.'],
        links: [{ label: 'Home', route: R.home }]
      },
      {
        id: 'start-flow', title: 'What happens when a customer buys',
        what: '<p>The customer adds variants to a cart (prices always come from your catalogue, never from the customer\'s browser), goes through checkout (address → delivery method → review) and pays through the payment provider (PayPal). When the payment is <strong>captured</strong>, the order becomes <strong>Processing</strong>, the stock leaves the warehouse that was chosen for it, discount uses are counted, download rights are granted for digital items and the confirmation e-mail goes out. From there it is in your hands: ship it, or deliver it over the counter.</p>',
        impact: ['Until the payment is captured the order is <strong>Pending</strong>: no stock moves, no e-mail, nothing to ship. An abandoned checkout stays Pending (or Cancelled when the customer backs out) and does not count a discount use.', 'Stock is checked at checkout and again at capture — two customers racing for the last unit cannot both get it.'],
        links: [{ label: 'Orders', route: R.commerceOrderList }]
      },
      {
        id: 'start-publish', title: 'Immediate vs published changes',
        what: '<p>Products, prices, stock, shipping and tax rules, discounts and store settings take effect <strong>immediately</strong> (the storefront refreshes its copy of the look within a minute). Storefront <strong>pages, bodies and templates</strong> have a draft and a published version: customers only ever see what you have <strong>published</strong> (and, for pages, made <strong>live</strong>).</p>',
        tips: ['When in doubt, open the storefront <strong>Preview</strong> — it shows drafts; the real shop never does.']
      }
    ]
  },
  {
    id: 'store', title: 'Store settings', icon: 'storefront',
    intro: 'One record that describes the business. Most of it is visible to customers.',
    topics: [
      {
        id: 'store-basics', title: 'Name, currency, contacts, logo',
        what: '<p><strong>System → Store</strong>. The store name and logo appear in the storefront header, in e-mails and on receipts. The default currency preselects new products and prices the cart. The support e-mail and phone are shown on the storefront\'s contact page, in the footer and on error pages; the support e-mail also receives contact-form messages when no staff recipient is configured.</p>',
        impact: ['Changing the currency does <em>not</em> convert existing prices; it only changes the default for new products.', 'The business address is the company\'s legal/identity address — it is <strong>never</strong> given to customers as a return destination. Returns go to a warehouse.'],
        tips: ['Weight and dimension units only change how numbers are shown; stock and shipping maths stay in grams and millimetres.', 'The low-stock default is the line under which a variant is listed as "low" when neither the variant nor the product sets its own.'],
        links: [{ label: 'Store settings', route: R.systemStore }]
      }
    ]
  },
  {
    id: 'catalog', title: 'Catalogue', icon: 'inventory_2',
    intro: 'Products are what customers browse; <strong>variants</strong> are what they actually buy (size, colour, edition…). Stock, prices, barcodes and files all hang on variants.',
    topics: [
      {
        id: 'catalog-products', title: 'Products and statuses',
        what: '<p>A product has a name, description, category, currency, base price, pictures, attributes and a status. <strong>DRAFT</strong> = you are still working on it, invisible to customers. <strong>ACTIVE</strong> = for sale. <strong>INACTIVE</strong> = hidden but kept. <strong>DISCONTINUED</strong> = gone for good but history stays.</p>',
        impact: ['Only ACTIVE products appear in the shop, and only their ACTIVE variants can be added to a cart.', 'A product without any variant cannot be bought — the shop says so.'],
        tips: ['Use the product list\'s <strong>bulk actions</strong> (select rows) to change status, prices, tags or category for many products at once — always with a preview first.'],
        links: [{ label: 'Products', route: R.catalogProductList }, { label: 'New product', route: R.catalogProductNew }]
      },
      {
        id: 'catalog-variants', title: 'Variants and pricing',
        what: '<p>Each variant has its own SKU, name, price, stock and attribute values. Pricing modes: <strong>Normal</strong> — the variant price is the selling price (empty = the product\'s base price); <strong>Flat adjustment</strong> — base price plus/minus an amount; <strong>Percent adjustment</strong> — base price plus/minus a percentage. The resulting <em>effective price</em> is what the customer pays.</p><p>The <strong>variant generator</strong> on the product\'s Variants tab builds every combination of the attribute options you pick (Colour × Size) with SKUs derived from the base SKU — running it again only adds the missing ones.</p>',
        impact: ['Changing a product\'s base price immediately changes every variant that uses Normal-with-empty-price or an adjustment mode.', 'A variant with price 0 sells for 0 — the shop will not stop you.'],
        tips: ['Keep the base SKU meaningful (e.g. <code>TSHIRT-01</code>): generated SKUs are <code>TSHIRT-01-RED-M</code>.', 'Unit cost is for your stock-valuation report only; customers never see it.']
      },
      {
        id: 'catalog-categories-tags', title: 'Categories, tags and attributes',
        what: '<p><strong>Categories</strong> form a tree and drive the storefront navigation and filters (attribute definitions attached to a category become that category\'s filters). <strong>Tags</strong> are free labels used to target discounts and shipping methods ("hats", "fragile"). <strong>Attribute definitions</strong> (Schema) describe things like Colour, Size, Material with their type (text, number, choice, date…) and options; a product or variant then carries <em>values</em> for them.</p>',
        impact: ['Filters in the shop only exist for attributes whose values are set on products or variants — an empty definition filters nothing.', 'Deleting a category that still has products is refused; move the products first.'],
        links: [{ label: 'Categories', route: R.catalogCategoryList }, { label: 'Tags', route: R.catalogTagList }, { label: 'Attribute definitions', route: R.schemaAttributeDefinitionList }]
      },
      {
        id: 'catalog-media', title: 'Pictures and videos',
        what: '<p>The product\'s Media tab holds images and videos; the <strong>primary</strong> one is the thumbnail in lists. Add several files at once with "Add files…", drag thumbnails to reorder. Variants can carry their own pictures (shown first when that variant is selected).</p>',
        tips: ['Nothing is uploaded until you press Save on the product — closing the page discards pending files.', 'Square images look best in the shop\'s grid.']
      },
      {
        id: 'catalog-digital', title: 'Digital products',
        what: '<p>A variant with fulfilment type <strong>DIGITAL</strong> is a download, not a parcel. Attach files on the variant\'s Digital files tab. When an order with digital lines is paid, the customer gets a <em>download entitlement</em> for each file (optionally limited in downloads or time) and the "downloads ready" e-mail; a digital-only order is delivered on the spot.</p>',
        impact: ['Digital variants never run out of stock and never ship; a mixed order ships only the physical lines.', 'You can revoke or restore a customer\'s downloads from the order\'s Downloads panel (e.g. after a refund).']
      },
      {
        id: 'catalog-shipping-spec', title: 'Weight and box size',
        what: '<p>Weight (grams) and length/width/height (mm) on the product are the defaults; a variant can override them. Shipping methods that charge by weight and live carrier rates use these numbers.</p>',
        impact: ['A variant with no weight is rated as 0 g — the quote warns about it. Set weights before you create weight-based shipping methods.']
      },
      {
        id: 'catalog-scan', title: 'Barcodes and scan codes',
        what: '<p>Every variant has a <strong>main code</strong>: its own id, printable as a QR / Code 128 label from the Codes tab. You can add <strong>aliases</strong> — the supplier\'s EAN-13/UPC-A on the carton, a marketplace code — so scanning any of them finds the variant (stock page, POS, purchase-order receiving).</p>',
        tips: ['EAN-13 and UPC-A aliases must be valid (right length and check digit); the same alias may sit on two variants — the scanner then asks which one.', '"Print labels" prints a sheet of main codes for the shelf or the bin.']
      },
      {
        id: 'catalog-csv', title: 'CSV import and export',
        what: '<p>Products (one row per variant), stock and discounts can be exported and imported as CSV. Imports always run a <strong>dry run</strong> first that lists every change and every error; nothing is written until you apply, and an import with any error applies <em>nothing</em> (all or nothing).</p>',
        impact: ['Products are matched by product SKU (else name) and variants by variant SKU; a variant SKU that belongs to another product is an error, never moved.', 'Stock import: "set" makes the quantity the new on-hand, "add" is a signed change; every changed row writes an ADJUSTMENT movement.'],
        links: [{ label: 'Products (Import / export)', route: R.catalogProductList }]
      }
    ]
  },
  {
    id: 'inventory', title: 'Inventory', icon: 'warehouse',
    intro: 'Stock is counted <strong>per variant per warehouse</strong>, and every change is a movement in a ledger you can always read back.',
    topics: [
      {
        id: 'inv-warehouses', title: 'Warehouses',
        what: '<p>A warehouse is a place that holds stock: name, code, address, priority, active flag and one <strong>default</strong>. The address matters: it is the origin for shipping quotes and the tax location for counter sales, and it is where returns are sent.</p>',
        impact: ['Orders are allocated to one warehouse that can cover every line (by priority, nearest country first); when none can, lines are split or marked short.', 'Deactivating a warehouse stops it from being allocated; its stock stays visible.'],
        tips: ['Give the default warehouse a complete address, or counter sales will be taxed by the catch-all rule only.'],
        links: [{ label: 'Warehouses', route: R.inventoryWarehouseList }]
      },
      {
        id: 'inv-stock', title: 'Stock, adjustments and the movement ledger',
        what: '<p><strong>Stock</strong> shows on-hand per variant per warehouse; adjust it with a reason. <strong>Stock Movements</strong> is the ledger: PURCHASE (received from a supplier), SALE (left with an order), ADJUSTMENT (manual / CSV / count), RETURN (restocked after a return), DAMAGE, TRANSFER (between warehouses), each with the quantity after the move.</p>',
        impact: ['A variant\'s total stock is simply the sum of its warehouse balances — there is no separate "total" to maintain.', 'Stock cannot go negative: an adjustment or sale that would do so is refused with the shortfall.'],
        links: [{ label: 'Stock', route: R.inventoryStock }, { label: 'Stock movements', route: R.inventoryMovements }]
      },
      {
        id: 'inv-transfers', title: 'Transfers between warehouses',
        what: '<p>Scan or pick a variant, choose from/to and a quantity: two paired TRANSFER movements are written (out of one, into the other). Transfers between the same warehouse or beyond the available quantity are refused.</p>',
        links: [{ label: 'Transfers', route: R.inventoryTransfers }]
      },
      {
        id: 'inv-low-stock', title: 'Low stock',
        what: '<p>Each variant (or its product, or the store) has a low-stock line. The Low Stock page lists variants at or below it, and a daily <strong>digest e-mail</strong> goes to the recipients set under Email notifications.</p>',
        links: [{ label: 'Low stock', route: R.inventoryLowStock }, { label: 'Email notifications', route: R.systemMail }]
      },
      {
        id: 'inv-po', title: 'Suppliers and purchase orders',
        what: '<p>A purchase order lists what you ordered from a supplier for a warehouse. <strong>DRAFT</strong> → <strong>Place</strong> → <strong>ORDERED</strong> → receive deliveries → <strong>PARTIALLY RECEIVED</strong> → <strong>RECEIVED</strong>; cancel while nothing has been received. Receiving can be typed per line or done by scanning cartons.</p>',
        impact: ['Every received unit is a PURCHASE movement into the PO\'s warehouse at the moment you receive it — never at placement.', 'You cannot receive more than is outstanding; the error tells you the remaining quantity.', 'A supplier with purchase orders cannot be deleted — mark it inactive instead.'],
        links: [{ label: 'Purchase orders', route: R.inventoryPurchaseOrderList }, { label: 'Suppliers', route: R.inventorySupplierList }]
      }
    ]
  },
  {
    id: 'orders', title: 'Orders, payments, shipments, returns', icon: 'receipt_long',
    intro: 'An order is the contract with the customer; the money, the stock and the parcels each have their own trail attached to it.',
    topics: [
      {
        id: 'orders-status', title: 'Order statuses',
        what: '<ul><li><strong>Pending</strong> — placed, not paid. No stock moved.</li><li><strong>Processing</strong> — paid; stock has left; waiting to be shipped or handed over.</li><li><strong>Shipped</strong> — every physical line is on a shipment that has left.</li><li><strong>Delivered</strong> — everything arrived (or was collected / downloaded).</li><li><strong>Cancelled</strong> — stopped before payment; nothing to undo.</li><li><strong>Partially refunded / Refunded</strong> — money went back to the customer.</li><li><strong>Returned</strong> — goods came back.</li><li><strong>Failed</strong> — the payment failed.</li></ul>',
        impact: ['Shipments move the order forward automatically; you rarely set the status by hand.', 'Refund statuses are set by the payment actions, never typed.'],
        links: [{ label: 'Orders', route: R.commerceOrderList }]
      },
      {
        id: 'orders-money', title: 'The Payment tab (money actions)',
        what: '<p>Load payment info to see what was charged, refunded and what is still refundable, with the provider\'s transactions. Actions: <strong>Capture</strong> (an approved-but-uncaptured online payment), <strong>Refund</strong> (full or partial, with a reason), <strong>Cancel</strong> (an unpaid order), <strong>Sync</strong> (re-read the provider). On a manual order you <strong>record</strong> the payment instead.</p>',
        impact: ['Every money action is permission-gated separately (<code>checkout:capture</code>, <code>checkout:refund</code>, <code>checkout:cancel</code>) and written to the audit log with the amount.', 'Refunding does not put stock back — use <strong>Restock</strong> for that.', 'Customers can never trigger a refund themselves; they can only request a return.'],
        tips: ['The refund e-mail goes out automatically with the amount and reason.']
      },
      {
        id: 'orders-shipments', title: 'Shipments and tracking',
        what: '<p>A shipment belongs to an order and says which warehouse it leaves from, which carrier and service, the tracking number and link. Statuses: Pending → Processing → Picked → Packed → <strong>Shipped</strong> → In transit → Out for delivery → <strong>Delivered</strong> (or Failed / Returned).</p>',
        impact: ['Shipped sends the "on its way" e-mail (with the tracking link) and moves the order to Shipped once all physical lines are covered; Delivered sends the delivered e-mail and completes the order.', 'With an EasyPost carrier you can <strong>Buy label</strong> from the shipment: the label PDF, tracking number and tracker are filled in, and the carrier\'s tracking webhook updates the status for you.', 'Customers see shipments and tracking links on their order page.'],
        links: [{ label: 'Shipments', route: R.commerceShipmentList }, { label: 'Carriers', route: R.rulesCarrierList }]
      },
      {
        id: 'orders-returns', title: 'Returns and refunds',
        what: '<p>A return is one order line, a quantity and a reason. Customers request it from their account; staff can file one from the order. Flow: <strong>Requested</strong> → <strong>Approved</strong> (customer gets instructions) or <strong>Rejected</strong> → <strong>Shipped</strong> back → <strong>Received</strong> → <strong>Inspecting</strong> → <strong>Refunded</strong> or <strong>Replaced</strong>. A customer may withdraw (Cancelled) only while it is still Requested.</p>',
        impact: ['The refund amount defaults to what the customer paid for the returned units (their share of the discount and tax included, shipping only when you tick "refund shipping"), capped at what is still refundable; "refund the whole remaining balance" is a separate button on purpose.', 'Issuing the refund moves the money through the provider and the order to (Partially) Refunded; <strong>Restock</strong> on the order puts the goods back as RETURN movements — two separate decisions.'],
        links: [{ label: 'Returns', route: R.commerceReturnList }]
      },
      {
        id: 'orders-manual', title: 'Manual orders and the counter (POS)',
        what: '<p><strong>Commerce → New order</strong> creates an order on behalf of a customer or a walk-in: scan or search lines, optional discount code, shipping address + method or "collected in store", payment CASH / CARD / BANK / OTHER or UNPAID. The totals preview is computed by the server exactly as the order will be.</p>',
        impact: ['A paid manual order is captured on the spot: stock leaves, the customer is e-mailed; paid + collected = delivered immediately.', 'UNPAID keeps the order Pending (no stock moved) until you record a payment on its Payment tab.', 'Cash short of the total is refused; change due is recorded. Collected sales are taxed at the warehouse address.'],
        links: [{ label: 'New order', route: R.commerceOrderNew }]
      },
      {
        id: 'orders-customers', title: 'Customers',
        what: '<p>Every registered buyer, with profile, addresses, orders and returns. The customer page is read-mostly: you look things up and start a manual order or a return from there.</p>',
        links: [{ label: 'Customers', route: R.commerceCustomerList }]
      }
    ]
  },
  {
    id: 'rules', title: 'Shipping, tax and carriers', icon: 'rule',
    intro: 'Rules price the order. Checkout refuses to proceed when no shipping method applies to a physical order, so set these up before you open.',
    topics: [
      {
        id: 'rules-shipping', title: 'Shipping methods',
        what: '<p>A shipping rule is a method customers can choose. It has <strong>matchers</strong> (countries/states/cities/postal codes, categories, tags, attribute definitions, origin warehouse) and a <strong>rate strategy</strong>: FLAT, PER ITEM, tiers by WEIGHT / PRICE / ITEM count, or CARRIER API (live rate from a carrier). Extras: free above an amount, handling fee, min/max charge, estimated days, priority.</p>',
        impact: ['At checkout every matching, available method is offered with its price; the recommended one (highest priority, cheapest) is preselected. Unavailable ones say why.', 'The quote is recomputed when the order is placed — a method that stopped applying is refused.', 'Weight tiers are inclusive (≤ 500 g); over the last tier the overage step/price applies per started step.'],
        tips: ['Use the <strong>test quote</strong> on the rules page with a sample address and lines to see exactly what customers will be offered.'],
        links: [{ label: 'Shipping rules', route: R.rulesShippingList }]
      },
      {
        id: 'rules-tax', title: 'Tax rules',
        what: '<p>A tax rule is a rate with matchers (country, state, city, postal code — empty = any). The most specific matching rule wins; a rule with no matchers is the catch-all. Tax is computed per line on the discounted price, at the shipping address (billing address when nothing ships; the warehouse address for collected sales).</p>',
        impact: ['No matching rule = no tax. If you need a floor, add a catch-all.', 'Prices in the catalogue are entered without tax unless the storefront behaviour says "prices include tax" (which only changes the wording shown to customers).'],
        links: [{ label: 'Tax rules', route: R.rulesTaxList }]
      },
      {
        id: 'rules-carriers', title: 'Carriers',
        what: '<p>A carrier record holds the account, credentials and service levels of UPS, FedEx, a local courier… Credentials are encrypted and never shown again after saving. Integration <strong>none</strong> = you enter tracking numbers by hand; <strong>easypost</strong> = live rates for CARRIER API shipping methods, label purchase from shipments and automatic tracking updates through the EasyPost webhook (its signing secret goes in "API secret").</p>',
        tips: ['The tracking URL template (<code>https://…?tracknum={tracking}</code>) turns tracking numbers into links for customers.'],
        links: [{ label: 'Carriers', route: R.rulesCarrierList }]
      }
    ]
  },
  {
    id: 'discounts', title: 'Discounts', icon: 'sell',
    intro: 'A discount is a code customers type at checkout.',
    topics: [
      {
        id: 'discounts-basics', title: 'Types, limits and scope',
        what: '<p>Types: <strong>Percentage</strong>, <strong>Fixed amount</strong>, <strong>Free shipping</strong>, <strong>Buy X get Y</strong>. Limits: valid from/to, maximum uses, minimum order amount, maximum discount amount, active flag. Scope: leave the targeting empty for the whole cart, or restrict to tags, categories or attribute definitions — then only matching lines are discounted (and the minimum amount is checked against them).</p>',
        impact: ['A use is counted only when the order is <strong>paid</strong> — abandoned checkouts do not burn a limited code.', 'Customers get a live preview ("saves 4.90" or the exact reason it is rejected) in the cart and at checkout.', 'The Discount performance report shows orders, revenue and the amount given per code.'],
        links: [{ label: 'Discounts', route: R.commerceDiscountList }, { label: 'Reports', route: R.reports }]
      }
    ]
  },
  {
    id: 'storefront', title: 'Storefront: look, pages, templates', icon: 'web',
    intro: 'The storefront is built from three layers: the <strong>default look</strong>, the <strong>pages</strong> (each with named bodies), and <strong>templates</strong> that temporarily override the look and pick page bodies — on a schedule if you like.',
    topics: [
      {
        id: 'sf-appearance', title: 'Appearance and behaviour',
        what: '<p><strong>System → Storefront</strong>. Appearance: theme (colours, light/dark, font and style presets), brand (favicon, share image), header (navigation source, custom links, search/account/cart toggles), footer (link columns, social links, copyright, contact flags), announcement bar (text, link, colour, time window), SEO (title template, description, robots). Behaviour: show out-of-stock products, show stock counts, show reviews, minimum order amount, prices include tax, default sort, products per page.</p>',
        impact: ['These are live settings — saving changes the shop within a minute (customers\' browsers re-check the look on every page change).', 'The storefront keeps text readable: if you pick a primary colour that would be unreadable on white, it darkens it for text and picks white or black on buttons automatically.'],
        links: [{ label: 'Storefront', route: R.systemStorefront }]
      },
      {
        id: 'sf-pages', title: 'Pages, roles and bodies',
        what: '<p>Every storefront page has a <strong>role</strong>: HOME, ABOUT, CONTACT, FAQ, TERMS, PRIVACY, SHIPPING POLICY, RETURNS POLICY (one each, seeded, cannot be deleted) or CUSTOM. The storefront knows where each role belongs (footer, checkout consent link, contact page). A page\'s content is a list of <strong>sections</strong> (hero, featured products, category grid, promo tiles, rich text, reviews, newsletter) kept in named <strong>bodies</strong> — e.g. the home page may have "Default", "Spring launch" and "Christmas" bodies.</p>',
        how: ['Open the page, create or edit a body on the Bodies tab, edit its sections on the Content tab.', '<strong>Publish</strong> the body (its draft becomes the published version).', '<strong>Make live</strong>: choose which published body the page shows. <strong>Take offline</strong> hides the page (404 for customers).'],
        impact: ['Customers see the live body\'s <em>published</em> sections only. Editing a draft never leaks.', 'A published TERMS page makes the checkout ask for consent; CONTACT gets the contact form under its sections; a CUSTOM page appears in the footer\'s Info column.'],
        links: [{ label: 'Storefront pages', route: R.systemStorefrontPages }]
      },
      {
        id: 'sf-templates', title: 'Templates and the schedule',
        what: '<p>A template is a saved look for an occasion. It can override the theme, header, footer, announcement and home sections (each with its own override flag), carry uploaded images, decide which page roles it affects (HOME and CUSTOM by default) and pick a <strong>body</strong> for each page. Publish it, then <strong>Activate now</strong> or add <strong>schedule windows</strong> (start/end, priority).</p>',
        impact: ['While a window is active the storefront shows the template\'s overrides and the bodies it picked; when it ends everything returns to the default look and the pages\' live bodies — automatically.', 'Publishing a template also publishes the bodies it references.', '"Snapshot of live" makes a template from today\'s look so you can always go back.'],
        tips: ['Use <strong>Preview</strong> with a template selected to check it before its date.'],
        links: [{ label: 'Templates & schedule', route: R.systemStorefrontTemplates }, { label: 'Preview', route: R.systemStorefrontPreview }]
      },
      {
        id: 'sf-contact', title: 'Contact form messages',
        what: '<p>Messages customers send from the storefront\'s contact page are stored and e-mailed to the "Contact form message" recipients (Email notifications), or to the store support e-mail when none is set. Each message carries the customer\'s e-mail, an optional order number and the text.</p>',
        tips: ['Set a staff recipient for "Contact form message" under Email notifications so messages reach the right inbox.'],
        links: [{ label: 'Email notifications', route: R.systemMail }]
      }
    ]
  },
  {
    id: 'email', title: 'E-mail', icon: 'mail',
    intro: 'Customers are kept informed automatically; staff get digests. Nothing is sent without an SMTP provider.',
    topics: [
      {
        id: 'email-smtp', title: 'SMTP / outbound mail',
        what: '<p><strong>Settings → SMTP / outbound mail</strong>: the account(s) the system sends through (host, port, user, password — stored encrypted and never shown again). The first active provider is used.</p>',
        impact: ['Without a provider, every mail is skipped quietly and the Manager shows a clear "No SMTP provider configured" when you try to send a test.'],
        links: [{ label: 'SMTP providers', route: R.smtpProviderSetting }]
      },
      {
        id: 'email-events', title: 'What is sent and when',
        what: '<p><strong>System → Email notifications</strong> lists every event with an on/off switch, a subject template and a preview: order confirmed (at payment), order shipped (with tracking), order delivered, refund issued, return received / approved / rejected, digital downloads ready; staff events: low-stock digest (daily) and contact form messages, each with their own recipients.</p>',
        impact: ['Each customer mail is sent once per order and event — re-saving an order does not re-send it.', 'Subject templates accept placeholders such as <code>{storeName}</code> and <code>{orderNumber}</code>.'],
        links: [{ label: 'Email notifications', route: R.systemMail }]
      }
    ]
  },
  {
    id: 'access', title: 'Users, roles and permissions', icon: 'admin_panel_settings',
    intro: 'Who can do what. Permissions are precise on purpose: money and access are separate from everyday work.',
    topics: [
      {
        id: 'access-model', title: 'Users, groups, roles',
        what: '<p>A <strong>user</strong> signs in. A <strong>role</strong> is a named set of permission grants; users get roles directly or through <strong>groups</strong>. The <strong>ADMIN</strong> group bypasses every check (keep it small). "Effective permissions" on a user shows every grant and where it comes from.</p>',
        links: [{ label: 'Users', route: R.usersSetting }, { label: 'User groups', route: R.userGroupsSetting }, { label: 'Roles & permissions', route: R.rolesSetting }]
      },
      {
        id: 'access-grammar', title: 'How a permission is written',
        what: '<p>A grant is <code>resource:action</code> — <code>catalog:read</code>, <code>orders:update</code>; <code>catalog:*</code> means every action on the catalogue; <code>*</code> means everything. Resources: catalog, schema, orders (+ manage, restock), shipments, returns (+ manage), discounts, rules, inventory, shipping (carriers), reviews, reports, customers, <strong>checkout</strong> (read / capture / refund / cancel / sync — money), iam (users, groups, roles), maintenance (+ bypass), audit, settings, storefront, smtp (+ send), contact.</p>',
        impact: ['Money actions need <code>checkout:…</code> explicitly; no other grant implies them.', '<code>orders:manage</code> / <code>returns:manage</code> give back-office access to <em>every</em> order or return; without it a user only sees their own.', 'A grant without an action (just <code>catalog</code>) is refused — it would never match anything.'],
        tips: ['Start from the seeded roles: CATALOG_ADMIN, INVENTORY_ADMIN, SHIPPING_ADMIN, FINANCE_ADMIN (money), SYSTEM_ADMIN (settings, storefront, mail, maintenance, audit). SUPER_ADMIN has everything.']
      }
    ]
  },
  {
    id: 'system', title: 'Maintenance mode and the audit log', icon: 'engineering',
    intro: 'Two safety nets: one for planned downtime, one for "who changed this?".',
    topics: [
      {
        id: 'system-maintenance', title: 'Maintenance mode',
        what: '<p><strong>System → Maintenance mode</strong>: switch it on now with a message, or schedule windows. While it is on, customers see a maintenance page (the storefront keeps checking and returns to the shop when the window ends); staff with <code>maintenance:bypass</code> and admins keep working — the Manager shows a red strip so nobody forgets it is on.</p>',
        impact: ['Customers in the middle of a checkout are held too; their cart is kept.', 'The storefront login stays reachable so staff can always get in and switch it off.'],
        links: [{ label: 'Maintenance mode', route: R.systemMaintenance }]
      },
      {
        id: 'system-audit', title: 'Audit log',
        what: '<p>Every change made through the Manager — and the important system events (checkout started, payment captured, provider events, shipments moving an order) — is recorded with who, when, what changed (before → after) and a summary. Filter by entity, action, user or text. Each editor also has a History panel for that one record.</p>',
        impact: ['Money actions show the real amounts; secrets (passwords, API keys) are masked in the log.'],
        links: [{ label: 'Audit log', route: R.systemAudit }]
      }
    ]
  },
  {
    id: 'insights', title: 'Reports and reviews', icon: 'insights',
    intro: 'Numbers to steer by, and the customer voice.',
    topics: [
      {
        id: 'insights-reports', title: 'Reports',
        what: '<p><strong>Insights → Reports</strong> (pick a period): sales summary and time series, top products and categories, geography (where orders ship to), order status breakdown, refunds, customers (new vs returning, top spenders), tax collected per rule, <strong>stock valuation</strong> (on-hand × unit cost per warehouse), discount performance, shipping charged per method (and carrier cost when known), returns by product and reason.</p>',
        impact: ['Revenue figures count paid orders (Processing and later); the dashboard\'s "today" is net of refunds.', 'Stock valuation is only as good as the unit costs you enter on products and variants.'],
        links: [{ label: 'Reports', route: R.reports }]
      },
      {
        id: 'insights-reviews', title: 'Reviews',
        what: '<p>Customers write reviews (stars + text) from the storefront product page and manage their own under their account. <strong>Insights → Reviews</strong> lets you read and remove them; the storefront shows them when the behaviour toggle "show reviews" is on.</p>',
        links: [{ label: 'Reviews', route: R.reviews }, { label: 'Storefront behaviour', route: R.systemStorefront }]
      }
    ]
  },
  {
    id: 'glossary', title: 'Glossary', icon: 'menu_book',
    intro: 'The words the Manager uses, in one place.',
    topics: [
      {
        id: 'glossary-terms', title: 'Terms',
        what: '<ul>'
          + '<li><strong>Variant</strong> — the sellable unit of a product (one SKU, one price, its own stock).</li>'
          + '<li><strong>Effective price</strong> — what a variant sells for after its pricing mode is applied to the product\'s base price.</li>'
          + '<li><strong>Capture</strong> — the moment the payment provider takes the money; the order becomes Processing and stock leaves.</li>'
          + '<li><strong>Allocation</strong> — choosing which warehouse an order\'s lines leave from.</li>'
          + '<li><strong>Movement</strong> — one line in the stock ledger (PURCHASE, SALE, ADJUSTMENT, RETURN, DAMAGE, TRANSFER).</li>'
          + '<li><strong>Entitlement</strong> — a customer\'s right to download a digital file bought on an order.</li>'
          + '<li><strong>Body</strong> — a named version of a storefront page\'s content; one is live.</li>'
          + '<li><strong>Template</strong> — a saved storefront look that can be activated or scheduled.</li>'
          + '<li><strong>Role</strong> — a named set of permission grants given to users or groups.</li>'
          + '<li><strong>Dry run</strong> — a preview of an import or bulk action that changes nothing.</li>'
          + '</ul>'
      }
    ]
  }
];
