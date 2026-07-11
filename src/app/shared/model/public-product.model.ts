import { Currency } from "../../../lib/model/currency.model";
import { AttributeDefinition } from "./attribute.model";

// ---- /public/products/search (POST) + /public/products (GET) ------------

// Per-attribute filter map: `{ [AttributeDefinition.name]: [string-values...] }`.
// Values are OR-within-key. Different keys AND together with each other and with
// the top-level filters.
export type ProductAttributeFilterMap = Record<string, string[]>;

export interface ProductSearchRequest {
    categoryId?: string;
    tagIds?: string[];
    q?: string;                              // case-insensitive substring on name + description
    currency?: Currency;
    minPrice?: string;                       // BigDecimal-as-string, inclusive
    maxPrice?: string;                       // BigDecimal-as-string, inclusive
    attributes?: ProductAttributeFilterMap;  // faceted: AND across keys, OR within a key
    page?: number;                           // 0-indexed
    size?: number;                           // default 20, capped at 200
    sort?: 'basePrice' | 'name' | 'id';      // server defaults to id (UUIDv7 → newest-first)
    sortDir?: 'ASC' | 'DESC';                // default 'DESC'
}

// ---- /public/products/filters?categoryId= -------------------------------
// Lightweight category-scoped filter view. Per-request, no caching.

export interface CategoryPriceRange {
    min: string;
    max: string;
    currency: Currency;
}

export interface CategoryFilterDimensions {
    categoryId?: string;
    attributes: AttributeDefinition[];       // Category.attributeDefinitions, or all when no categoryId
    currencies: Currency[];
    priceRange?: CategoryPriceRange;         // populated only when a single currency is in scope
}

// ---- /public/products/filter-map (cached, 60s refresh) ------------------
// Complete self-describing filter catalog. Every query parameter the shopper may
// use, with a `kind` hint telling the frontend how to render the control.

export type FilterKind =
    | 'TEXT_SEARCH'                          // free-text search box
    | 'TEXT'                                 // exact-match text
    | 'NUMBER'                               // exact-match number
    | 'BOOLEAN'                              // toggle / checkbox
    | 'SINGLE_SELECT'                        // dropdown or radio
    | 'MULTI_SELECT'                         // checkbox list (multiValue: true)
    | 'RANGE_NUMBER'                         // min/max inputs (uses key + secondaryKey)
    | 'RANGE_PRICE'                          // currency-aware min/max (uses ranges[currency])
    | 'DATE' | 'TIME' | 'DATE_TIME';

export interface FilterMapOption {
    value: string;
    displayValue: string;
}

// For RANGE_PRICE, one entry per currency.
export interface FilterMapRange {
    min: string;
    max: string;
}

export interface FilterMapEntry {
    key: string;                             // primary query param name
    secondaryKey?: string;                   // RANGE_*: the second bound (e.g. `maxPrice`)
    displayName: string;
    kind: FilterKind;
    multiValue?: boolean;                    // MULTI_SELECT: shopper can pick several
    options?: FilterMapOption[];             // *_SELECT
    ranges?: Record<string, FilterMapRange>; // RANGE_PRICE only — keyed by currency code
    meta?: Record<string, string>;           // see § 8.4.4 'Meta keys' table for known keys
}

export interface ProductFilterMap {
    computedAt: string;                      // ISO instant when the cache was last refreshed
    filters: FilterMapEntry[];
}

// Known `meta` keys the frontend may want to read (per spec § 8.4.4):
//   appliesTo                — TEXT_SEARCH: which fields the search hits (e.g. "name+description")
//   attribute.type           — underlying ProductAttributeType for attribute.* filters
//   attribute.unit           — the definition's unit string (e.g. "cm", "kg")
//
// NOTE: `attribute.variantLevel` and `attribute.required` were removed when the
// backend dropped those fields from AttributeDefinition. The backend no longer
// emits those meta keys.
export const FILTER_MAP_META = {
    APPLIES_TO: 'appliesTo',
    ATTRIBUTE_TYPE: 'attribute.type',
    ATTRIBUTE_UNIT: 'attribute.unit'
} as const;

// (Callers who need to interpret the `attribute.type` meta string should import
// `ProductAttributeType` from `./attribute.model` directly.)
