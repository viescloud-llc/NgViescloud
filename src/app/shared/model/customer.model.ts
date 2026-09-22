import { ViesDateTime } from '../../../lib/model/vies.model';
import { Address } from './address.model';
import { OrderFulfillment, ReturnRequest } from './commerce.model';
import { Review, UserInfo } from './user-info.model';

// Back-office customer views — GET /api/v1/customers (authority `customers`).
// Assembled server-side from the lib User + UserInfo + UserAddress + orders /
// returns / reviews keyed by userId. Read-only except staff notes.

export interface CustomerSummary {
    userId: string;
    username: string;
    alias?: string | null;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phoneNumber?: string | null;
    verified?: boolean | null;
    inactive?: boolean | null;
    groups: string[];
    registeredAt?: ViesDateTime | null;
    displayName: string;
    orderCount: number;
    /** Captured, not-fully-refunded order totals by currency code. */
    lifetimeValueByCurrency: Record<string, string | number>;
    lastOrderAt?: ViesDateTime | null;
    openReturns: number;
    reviewCount: number;
}

export interface CustomerNote {
    id: string;
    userId: string;
    authorUserId?: string | null;
    authorName?: string | null;
    text: string;
    createdAt?: ViesDateTime;
}

export interface CustomerDetail {
    summary: CustomerSummary;
    userInfo?: UserInfo | null;
    addresses: Address[];
    returns: ReturnRequest[];
    reviews: Review[];
    notes: CustomerNote[];
}

export interface CustomerPage {
    content: CustomerSummary[];
    page: number;
    size: number;
    total: number;
}

export type CustomerOrders = OrderFulfillment[];
