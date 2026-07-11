import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Currency } from '../../model/currency.model';

// Centralized currency-aware BigDecimal formatter. Backend sends money as a string
// (so float arithmetic doesn't drift); this component is the ONLY place we should be
// calling `Intl.NumberFormat` for currency display in the app.
//
// Usage:
//   <app-money [value]="product.basePrice" [currency]="product.currency"></app-money>
//   <app-money value="49.95" currency="USD"></app-money>
//
// Falls back to the raw value (with the currency code suffix) if Intl can't format it
// (unknown currency code, malformed value). Renders an empty span for null/undefined
// values so it composes cleanly inside conditional templates.
@Component({
  selector: 'app-money',
  templateUrl: './money.component.html',
  styleUrls: ['./money.component.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoneyComponent {
  value = input<string | number | null | undefined>(null);
  currency = input<Currency | string | null | undefined>(null);

  // Optional BCP-47 locale; defaults to the browser's resolved locale via Intl.
  locale = input<string | null | undefined>(null);

  // Optional override of fraction-digit policy. By default `Intl.NumberFormat` picks
  // sensible per-currency defaults (USD → 2, JPY → 0, etc).
  minimumFractionDigits = input<number | null | undefined>(null);
  maximumFractionDigits = input<number | null | undefined>(null);

  formatted = computed<string>(() => {
    const raw = this.value();
    const currency = this.currency();

    if (raw === null || raw === undefined || raw === '') return '';
    if (!currency) return String(raw);

    const numeric = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isFinite(numeric)) return `${raw} ${currency}`;

    try {
      const options: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: currency
      };
      const min = this.minimumFractionDigits();
      const max = this.maximumFractionDigits();
      if (min !== null && min !== undefined) options.minimumFractionDigits = min;
      if (max !== null && max !== undefined) options.maximumFractionDigits = max;

      return new Intl.NumberFormat(this.locale() ?? undefined, options).format(numeric);
    } catch {
      // Unknown currency code or other Intl rejection — degrade gracefully.
      return `${raw} ${currency}`;
    }
  });
}
