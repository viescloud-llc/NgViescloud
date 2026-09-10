import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

// Renders scan codes in the browser and prints label sheets. The backend
// stays data-only: the MAIN code is the variant id (a UUID — small as a QR,
// long as a 1D stripe), aliases are whatever text the outside label carried.
export type LabelFormat = 'QR' | 'CODE_128';

export interface LabelSpec {
  /** The text to encode (variant id or alias value). */
  value: string;
  /** Human line under the code, e.g. SKU / variant name. */
  title?: string;
  subtitle?: string;
  format: LabelFormat;
  copies?: number;
}

export class ScanLabelUtil {
  private constructor() {}

  /** QR as a PNG data URL (sharp at any size; error correction M). */
  static async qrDataUrl(value: string, sizePx: number = 160): Promise<string> {
    return QRCode.toDataURL(value, { width: sizePx, margin: 1, errorCorrectionLevel: 'M' });
  }

  /** Code 128 as an SVG string (any ASCII text; width grows with length). */
  static code128Svg(value: string, options: { height?: number; displayValue?: boolean; width?: number } = {}): string {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    JsBarcode(svg, value, {
      format: 'CODE128',
      height: options.height ?? 48,
      width: options.width ?? 1.4,
      displayValue: options.displayValue ?? true,
      fontSize: 11,
      margin: 6
    });
    return new XMLSerializer().serializeToString(svg);
  }

  /** Opens a print-ready window with `copies` labels per spec (browser print dialog). */
  static async printLabels(specs: LabelSpec[]): Promise<void> {
    const cells: string[] = [];
    for (const spec of specs) {
      const copies = Math.max(1, Math.min(200, Number(spec.copies ?? 1)));
      const code = spec.format === 'QR'
        ? `<img src="${await ScanLabelUtil.qrDataUrl(spec.value, 220)}" alt="" />`
        : ScanLabelUtil.code128Svg(spec.value, { height: 56, width: 1.2 });
      const cell = `<div class="label">
          ${code}
          ${spec.title ? `<div class="title">${escapeHtml(spec.title)}</div>` : ''}
          ${spec.subtitle ? `<div class="subtitle">${escapeHtml(spec.subtitle)}</div>` : ''}
          ${spec.format === 'QR' ? `<div class="value">${escapeHtml(spec.value)}</div>` : ''}
        </div>`;
      for (let i = 0; i < copies; i++) cells.push(cell);
    }
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Labels</title>
      <style>
        body { margin: 8mm; font-family: system-ui, sans-serif; color: #000; background: #fff; }
        .sheet { display: flex; flex-wrap: wrap; gap: 6mm; }
        .label { width: 50mm; padding: 3mm; border: 1px dashed #bbb; text-align: center; page-break-inside: avoid; }
        .label img { width: 32mm; height: 32mm; }
        .label svg { max-width: 100%; height: auto; }
        .title { font-size: 11pt; font-weight: 600; margin-top: 1mm; }
        .subtitle { font-size: 9pt; color: #333; }
        .value { font-size: 6.5pt; font-family: monospace; word-break: break-all; margin-top: 1mm; color: #444; }
        @media print { .label { border-color: transparent; } }
      </style></head><body><div class="sheet">${cells.join('')}</div>
      <script>window.onload = () => { window.focus(); window.print(); };</script></body></html>`;
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) throw new Error('Popup blocked — allow popups to print labels');
    w.document.open();
    w.document.write(html);
    w.document.close();
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
