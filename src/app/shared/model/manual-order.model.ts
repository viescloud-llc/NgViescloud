import { Address } from './address.model';
import { ShippingQuote } from './commerce.model';
import { Currency } from '../../../lib/model/currency.model';

// Staff-created orders — POST /api/v1/orders/manual[/preview] (orders:create).
export type PaymentMethod = 'ONLINE' | 'CASH' | 'CARD_TERMINAL' | 'BANK_TRANSFER' | 'OTHER' | 'UNPAID';

export const OFFLINE_PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD_TERMINAL', label: 'Card terminal' },
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'OTHER', label: 'Other' },
  { value: 'UNPAID', label: 'Unpaid (pay later)' }
];

export interface ManualOrderLine {
  productVariantId: string;
  quantity: number;
  unitPrice?: string | null;
}

export interface ManualOrderRequest {
  customerId?: string | null;
  walkIn?: { name: string; email?: string; phone?: string } | null;
  lines: ManualOrderLine[];
  discountCode?: string | null;
  collected: boolean;
  shippingAddress?: Address | null;
  billingAddress?: Address | null;
  shippingRuleId?: string | null;
  warehouseId?: string | null;
  paymentMethod: PaymentMethod;
  paymentReference?: string | null;
  amountTendered?: string | null;
  handedOver?: boolean;
  notes?: string | null;
}

export interface ManualOrderPreviewLine {
  productVariantId: string;
  sku: string;
  name: string;
  productName?: string | null;
  quantity: number;
  unitPrice: string | number;
  lineTotal: string | number;
  digital: boolean;
  stockOnHand?: number | null;
}

export interface ManualOrderPreview {
  currency?: Currency | null;
  lines: ManualOrderPreviewLine[];
  subtotal: string | number;
  discountAmount: string | number;
  discountCode?: string | null;
  tax: string | number;
  shippingCost: string | number;
  total: string | number;
  digitalOnly: boolean;
  shippingQuote?: ShippingQuote | null;
  warnings: string[];
  change?: string | number | null;
}
