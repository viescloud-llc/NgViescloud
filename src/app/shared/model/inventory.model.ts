import { MatInputDisable, MatInputDisplayLabel, MatInputEnum, MatInputHide, MatInputItemSetting, MatItemSettingType, MatTableDisplayLabel, MatTableHide } from '../../../lib/model/mat.model';
import { Currency } from '../../../lib/model/currency.model';
import { Address } from './address.model';
import { TrackedTimeStamp } from './tracked.model';

// A physical location stock is held in and shipped from (table: warehouses).
// Stock itself is InventoryLevel rows (variant × warehouse); the variant's
// stockQuantity is the cached sum. The address is the ship-from every carrier
// rate/label request needs. Exactly one warehouse is the default (movements
// with no warehouse land there; allocation falls back to it).
export class Warehouse extends TrackedTimeStamp {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    @MatTableHide()
    id: string = '';

    @MatInputDisplayLabel('Name', 'e.g "Main", "Berlin Hub"')
    name: string = '';

    @MatInputDisplayLabel('Code', 'short handle, upper-cased on save, e.g MAIN, EU-BER')
    code: string = '';

    @MatInputDisplayLabel('Description')
    @MatInputItemSetting(MatItemSettingType.TEXT_AREA, true)
    @MatTableHide()
    description: string = '';

    // Rendered by its own address form in the editor.
    @MatInputHide()
    @MatTableDisplayLabel('Location', (w: Warehouse) => [w.address?.city, w.address?.country].filter(Boolean).join(', '))
    address: Address = new Address();

    @MatInputDisplayLabel('Active')
    active: boolean = true;

    @MatInputDisplayLabel('Priority', 'allocation preference between warehouses that can both fulfil an order; higher wins')
    priority: number = 0;

    @MatInputDisplayLabel('Default warehouse', 'movements without a warehouse land here; last resort for allocation')
    @MatTableDisplayLabel('Default', (w: Warehouse) => w.defaultWarehouse ? 'yes' : '')
    defaultWarehouse: boolean = false;

    @MatInputDisplayLabel('Notes')
    @MatInputItemSetting(MatItemSettingType.TEXT_AREA, true)
    @MatTableHide()
    notes: string = '';
}

// Units of one variant in one warehouse. READ-ONLY on the wire — written only
// through stock movements (which name a warehouse) and checkout sales.
export interface InventoryLevel {
    id: string;
    productVariantId: string;
    warehouse?: Warehouse | null;
    quantity: number;
}

// ---- §6 stock operations ------------------------------------------------------

// Who we buy from (table: suppliers, /api/v1/suppliers, authority `inventory`).
export class Supplier extends TrackedTimeStamp {
    @MatInputDisable()
    @MatInputDisplayLabel('ID')
    @MatTableHide()
    id: string = '';

    @MatInputDisplayLabel('Name')
    name: string = '';

    @MatInputDisplayLabel('Code', 'short handle, upper-cased on save, e.g ACME; unique when set')
    code: string = '';

    @MatInputDisplayLabel('Contact name')
    @MatTableHide()
    contactName: string = '';

    @MatInputDisplayLabel('Email')
    email: string = '';

    @MatInputDisplayLabel('Phone')
    @MatTableHide()
    phone: string = '';

    @MatInputDisplayLabel('Website')
    @MatTableHide()
    website: string = '';

    @MatInputHide()
    @MatTableHide()
    address: Address = new Address();

    @MatInputEnum(Currency)
    @MatInputDisplayLabel('Currency', 'their invoices; purchase-order unit costs are in it')
    currency: Currency = Currency.USD;

    @MatInputDisplayLabel('Lead time (days)', 'typical order → delivery; prefills the expected date on a PO')
    leadTimeDays: number = 0;

    @MatInputDisplayLabel('Payment terms', 'e.g Net 30')
    @MatTableHide()
    paymentTerms: string = '';

    @MatInputDisplayLabel('Notes')
    @MatInputItemSetting(MatItemSettingType.TEXT_AREA, true)
    @MatTableHide()
    notes: string = '';

    @MatInputDisplayLabel('Active')
    active: boolean = true;
}

export type PurchaseOrderStatus = 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderLine {
    id?: string;
    productVariantId: string;
    sku?: string;
    name?: string;
    quantityOrdered: number;
    quantityReceived?: number;
    quantityOutstanding?: number;
    unitCost?: string | number | null;
    lineTotal?: string | number;
    sortOrder?: number;
}

// An order with a supplier for stock arriving in ONE warehouse
// (/api/v1/purchase-orders). Receiving writes PURCHASE movements referenced by the PO number.
export interface PurchaseOrder {
    id?: string;
    poNumber?: string;
    supplier?: Supplier | { id: string } | null;
    warehouse?: Warehouse | { id: string } | null;
    status?: PurchaseOrderStatus;
    currency?: Currency | null;
    supplierReference?: string | null;
    expectedDate?: string | null;
    orderedAt?: string | null;
    receivedAt?: string | null;
    notes?: string | null;
    lines: PurchaseOrderLine[];
    totalCost?: string | number;
    totalOrdered?: number;
    totalReceived?: number;
}

// GET /inventory/low-stock
export interface LowStockLevel { warehouseId: string; warehouseCode: string; warehouseName: string; quantity: number; }
export interface LowStockRow {
    variantId: string;
    productId?: string | null;
    productName?: string | null;
    variantName?: string | null;
    sku: string;
    status?: string | null;
    onHand: number;
    threshold: number;
    thresholdSource: 'VARIANT' | 'PRODUCT' | 'STORE';
    levels: LowStockLevel[];
    onOrder: number;
}

// POST /inventory/transfers
export interface TransferRequest { variantId: string; fromWarehouseId: string; toWarehouseId: string; quantity: number; reason?: string; reference?: string; }
export interface TransferResult { reference: string; fromQuantityAfter: number; toQuantityAfter: number; }
export interface DigestResult { items: number; recipients: string[]; sent: boolean; skippedReason?: string | null; }
