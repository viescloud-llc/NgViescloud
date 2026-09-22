import { MatInputDisable, MatInputDisplayLabel, MatInputEnum, MatInputHide, MatInputItemSetting, MatItemSettingType, MatTableHide } from '../../../lib/model/mat.model';
import { Currency } from '../../../lib/model/currency.model';
import { Address } from './address.model';
import { TrackedTimeStamp } from './tracked.model';

export enum WeightUnit { G = 'G', KG = 'KG', OZ = 'OZ', LB = 'LB' }
export enum DimensionUnit { MM = 'MM', CM = 'CM', IN = 'IN' }

// The single store-settings row (/api/v1/store-settings, authority `settings`).
// Mails, receipts, the low-stock line and the storefront read it; the backend
// properties only seed it once. Logo fields are owned by the logo endpoints.
export class StoreSettings extends TrackedTimeStamp {
    @MatInputHide()
    @MatTableHide()
    id: string = '';

    @MatInputDisplayLabel('Store name', 'shown in mails, receipts and the storefront')
    storeName: string = '';

    @MatInputDisplayLabel('Legal name', 'invoices / receipts, when it differs from the brand')
    legalName: string = '';

    @MatInputDisplayLabel('Storefront URL', 'public base URL; order links in mails point here')
    storefrontUrl: string = '';

    @MatInputEnum(Currency)
    @MatInputDisplayLabel('Default currency', 'preselected on new products and manual orders')
    defaultCurrency: Currency = Currency.USD;

    @MatInputDisplayLabel('Support email', 'shown to buyers in mails')
    supportEmail: string = '';

    @MatInputDisplayLabel('Support phone')
    supportPhone: string = '';

    @MatInputDisplayLabel('Mail Reply-To', 'Reply-To header on transactional mail (empty = none)')
    mailReplyTo: string = '';

    @MatInputDisplayLabel('Tax / VAT id', 'printed on receipts')
    taxId: string = '';

    @MatInputHide()
    @MatTableHide()
    address: Address = new Address();

    @MatInputHide()
    logoObjectId?: string | null = null;
    @MatInputHide()
    logoPath?: string | null = null;
    @MatInputHide()
    logoContentType?: string | null = null;

    @MatInputDisplayLabel('Low-stock default', 'the line for variants/products that set none')
    lowStockDefault: number = 5;

    @MatInputEnum(WeightUnit)
    @MatInputDisplayLabel('Weight display unit', 'stored in grams; this is how staff see it')
    weightUnit: WeightUnit = WeightUnit.G;

    @MatInputEnum(DimensionUnit)
    @MatInputDisplayLabel('Dimension display unit', 'stored in millimetres')
    dimensionUnit: DimensionUnit = DimensionUnit.MM;

    @MatInputDisplayLabel('Receipt footer', 'printed at the bottom of counter receipts')
    @MatInputItemSetting(MatItemSettingType.TEXT_AREA, true)
    receiptFooter: string = '';
}

// GET /api/v1/public/store (no auth)
export interface PublicStoreInfo {
    storeName: string;
    storefrontUrl?: string | null;
    defaultCurrency?: Currency | null;
    supportEmail?: string | null;
    supportPhone?: string | null;
    hasLogo: boolean;
    logoUrl?: string | null;
    weightUnit: WeightUnit;
    dimensionUnit: DimensionUnit;
}
