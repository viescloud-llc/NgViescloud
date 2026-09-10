import { MatInputDisable, MatInputDisplayLabel, MatInputHide, MatInputItemSetting, MatItemSettingType, MatTableDisplayLabel, MatTableHide } from '../../../lib/model/mat.model';
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
