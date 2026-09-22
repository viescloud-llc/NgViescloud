import { OrderFulfillment } from '../model/commerce.model';

// Counter receipt in a print window (same pattern as label printing).
export class ReceiptPrintUtil {
  private constructor() {}

  static print(order: OrderFulfillment, store?: { storeName?: string; legalName?: string; taxId?: string; receiptFooter?: string } | null): void {
    const storeName = store?.storeName || 'Venzora';
    const m = order.metadata ?? {};
    const money = (v: unknown) => Number(v ?? 0).toFixed(2);
    const rows = (order.items ?? []).map(i => `<tr><td>${esc(i.productVariant?.variantName || i.lineItemSku || '')}<br><small>${esc(i.lineItemSku || '')}</small></td><td class="n">${i.quantity}</td><td class="n">${money(i.unitPrice)}</td><td class="n">${money(i.totalPrice)}</td></tr>`).join('');
    const customer = m['customer.name'] ? `<p>Customer: ${esc(m['customer.name'])}${m['customer.phone'] ? ' · ' + esc(m['customer.phone']) : ''}</p>` : '';
    const payment = m['payment.method'] ? `<p>Paid by ${esc(m['payment.method'])}${m['payment.reference'] ? ' · ref ' + esc(m['payment.reference']) : ''}${m['payment.amountTendered'] ? `<br>Tendered ${esc(m['payment.amountTendered'])} · Change ${esc(m['payment.change'] ?? '0.00')}` : ''}</p>` : '<p><strong>UNPAID</strong></p>';
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${esc(order.orderNumber)}</title>
      <style>
        body { font-family: ui-monospace, Menlo, Consolas, monospace; width: 72mm; margin: 4mm auto; color: #000; font-size: 11px; }
        h1 { font-size: 14px; text-align: center; margin: 0 0 4px; } p { margin: 2px 0; } .c { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin: 6px 0; } td { padding: 2px 0; vertical-align: top; } .n { text-align: right; white-space: nowrap; }
        .totals td { border-top: 1px dashed #000; } .grand td { font-weight: bold; font-size: 13px; }
        @media print { body { margin: 0; } }
      </style></head><body>
      <h1>${esc(storeName)}</h1>
      ${store?.legalName && store.legalName !== storeName ? `<p class="c">${esc(store.legalName)}</p>` : ''}
      ${store?.taxId ? `<p class="c">Tax id ${esc(store.taxId)}</p>` : ''}
      <p class="c">Order ${esc(order.orderNumber)}</p>
      <p class="c">${new Date().toLocaleString()}</p>
      ${customer}
      <table><tbody>${rows}</tbody></table>
      <table class="totals"><tbody>
        <tr><td>Subtotal</td><td class="n">${money(order.subtotal)}</td></tr>
        ${Number(order.discountAmount) > 0 ? `<tr><td>Discount</td><td class="n">-${money(order.discountAmount)}</td></tr>` : ''}
        <tr><td>Tax</td><td class="n">${money(order.tax)}</td></tr>
        ${Number(order.shippingCost) > 0 ? `<tr><td>Shipping</td><td class="n">${money(order.shippingCost)}</td></tr>` : ''}
        <tr class="grand"><td>Total ${esc(order.currency)}</td><td class="n">${money(order.totalAmount)}</td></tr>
      </tbody></table>
      ${payment}
      <p class="c">${esc(store?.receiptFooter || 'Thank you!')}</p>
      <script>window.onload = () => { window.focus(); window.print(); };</script></body></html>`;
    const w = window.open('', '_blank', 'width=420,height=700');
    if (!w) throw new Error('Popup blocked — allow popups to print the receipt');
    w.document.open(); w.document.write(html); w.document.close();
  }
}

function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
