// Transactional email settings — /api/v1/mail (authority resource `smtp`).
export type MailEvent =
  | 'ORDER_CONFIRMED' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED' | 'REFUND_ISSUED'
  | 'RETURN_RECEIVED' | 'RETURN_APPROVED' | 'RETURN_REJECTED' | 'DIGITAL_DOWNLOADS_READY'
  | 'LOW_STOCK_DIGEST';

export interface MailEventSetting {
  event: MailEvent;
  label: string;
  description: string;
  enabled: boolean;
  defaultSubject: string;
  subjectOverride?: string | null;
  // Staff mails (low-stock digest) go to these comma-separated recipients instead of a buyer.
  staff: boolean;
  recipients?: string | null;
}
