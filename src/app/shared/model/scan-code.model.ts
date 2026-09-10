import { ProductVariant } from './product.model';
import { Currency } from '../../../lib/model/currency.model';

// The drawing style a scannable code was printed in. Descriptive only —
// lookups compare the decoded TEXT, which every symbology delivers the same way.
export enum ScanCodeSymbology {
    QR = 'QR',
    DATA_MATRIX = 'DATA_MATRIX',
    EAN_13 = 'EAN_13',
    UPC_A = 'UPC_A',
    CODE_128 = 'CODE_128',
    CODE_39 = 'CODE_39',
    OTHER = 'OTHER'
}

export const SCAN_CODE_SYMBOLOGY_LABELS: Record<ScanCodeSymbology, string> = {
    [ScanCodeSymbology.QR]: 'QR code',
    [ScanCodeSymbology.DATA_MATRIX]: 'DataMatrix',
    [ScanCodeSymbology.EAN_13]: 'EAN-13',
    [ScanCodeSymbology.UPC_A]: 'UPC-A',
    [ScanCodeSymbology.CODE_128]: 'Code 128',
    [ScanCodeSymbology.CODE_39]: 'Code 39',
    [ScanCodeSymbology.OTHER]: 'Other / unknown'
};

// An ALIAS scan code on a variant (table: product_variant_scan_codes): any
// barcode / QR / DataMatrix text from outside our system that should resolve
// to the variant when scanned. The variant's MAIN code is its own id (UUIDv7),
// printed as a QR (or Code 128). Aliases may repeat across variants; never
// twice on one variant; never equal to one of our variant ids.
export interface ProductVariantScanCode {
    id?: string;
    productVariantId?: string;
    codeValue: string;
    symbology: ScanCodeSymbology;
    label?: string | null;
    notes?: string | null;
    active: boolean;
}

// GET /product/variants/by-code/{code}
export type ScanMatchedBy = 'MAIN' | 'ALIAS' | 'NONE';

export interface ScanLookupMatch {
    variant: ProductVariant;
    productId?: string | null;
    productName?: string | null;
    currency?: Currency | null;
    effectivePrice?: string | number | null;
    stockQuantity?: number | null;
    alias?: ProductVariantScanCode | null;
}

export interface ScanLookupResult {
    code: string;
    matchedBy: ScanMatchedBy;
    matches: ScanLookupMatch[];
}
