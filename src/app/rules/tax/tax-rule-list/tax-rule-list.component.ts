import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatRadioModule } from '@angular/material/radio';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { APP_ROUTES } from '../../../app.routes';
import { TaxRule } from '../../../shared/model/commerce.model';
import { TaxRuleService } from '../../../shared/service/tax-rule/tax-rule.service';
import { TaxRuleImportExportService, TaxRuleImportMode } from '../../../shared/service/tax-rule-import-export/tax-rule-import-export.service';

// Tax-rule registry at /rules/tax/list.
//
// Rows are sorted by (specificity DESC, priority DESC) — the exact order the
// backend evaluates matchers in — so the table literally reads as "first rule
// whose matchers pass wins". Specificity = number of non-empty matcher fields.
//
// Also hosts:
//   • Export → downloads the full registry as JSON.
//   • Import → file picker + append/replace mode. Replace deletes every
//     existing rule first (transactional server-side) — confirm shows the
//     count that will be wiped.
//   • Test pad — type a shipping address, see which rule wins and the rate.
//     Client-side reproduction of the matching algorithm; informational only.
@Component({
  selector: 'app-tax-rule-list',
  templateUrl: './tax-rule-list.component.html',
  styleUrls: ['./tax-rule-list.component.scss'],
  imports: [NgComponentModule, MatRadioModule]
})
export class TaxRuleListComponent extends ViesMatFormFieldMap implements OnInit {

  protected readonly rxjsUtils = inject(RxJSUtils);
  protected readonly dialogUtils = inject(DialogUtils);
  protected readonly taxRuleService = inject(TaxRuleService);
  protected readonly importExportService = inject(TaxRuleImportExportService);
  protected readonly router = inject(Router);

  rules = signal<TaxRule[]>([]);
  blankRule = new TaxRule();

  // Backend evaluation order: active rules, specificity DESC, priority DESC.
  sortedRules = computed<TaxRule[]>(() =>
    [...this.rules()].sort((a, b) => {
      const spec = this.specificity(b) - this.specificity(a);
      if (spec !== 0) return spec;
      return (b.priority ?? 0) - (a.priority ?? 0);
    })
  );

  // ---- Test pad state --------------------------------------------------------
  testCountry = signal<string>('');
  testState = signal<string>('');
  testCity = signal<string>('');
  testPostalCode = signal<string>('');

  testResult = computed<{ rule: TaxRule | null; checked: boolean }>(() => {
    const country = this.testCountry().trim();
    const state = this.testState().trim();
    const city = this.testCity().trim();
    const postal = this.testPostalCode().trim();
    // Only evaluate once the admin has typed something.
    if (!country && !state && !city && !postal) return { rule: null, checked: false };

    const candidates = this.sortedRules().filter(r => {
      if (!r.active) return false;
      // A non-empty matcher must equal the address field (case-insensitive);
      // an empty matcher matches anything.
      const eq = (matcher: string, actual: string) =>
        !matcher || matcher.toLowerCase() === actual.toLowerCase();
      return eq(r.country, country) && eq(r.state, state) && eq(r.city, city) && eq(r.postalCode, postal);
    });
    // sortedRules is already in eval order → first candidate wins.
    return { rule: candidates[0] ?? null, checked: true };
  });

  ngOnInit(): void {
    this.refresh();
  }

  refresh() {
    this.taxRuleService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => this.rules.set(res),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  specificity(rule: TaxRule): number {
    return [rule.country, rule.state, rule.city, rule.postalCode]
      .filter(f => !!f && f.trim() !== '').length;
  }

  addRule() {
    this.router.navigate([APP_ROUTES.rulesTaxNew]);
  }

  selectRule(rule: TaxRule) {
    if (!rule.id) return;
    this.router.navigate([APP_ROUTES.rulesTax(rule.id)]);
  }

  // ---- Export ----------------------------------------------------------------

  exportRules() {
    this.importExportService.exportRules().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: rules => {
        const blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tax-rules.json';
        a.click();
        URL.revokeObjectURL(url);
      },
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  // ---- Import ----------------------------------------------------------------

  importMode = signal<TaxRuleImportMode>('append');

  async onImportFilePicked(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = ''; // allow re-picking the same file
    if (!file) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      this.dialogUtils.openErrorMessage('Invalid file', 'The selected file is not valid JSON.');
      return;
    }
    if (!Array.isArray(parsed)) {
      this.dialogUtils.openErrorMessage('Invalid file', 'Expected a JSON array of tax rules.');
      return;
    }

    const mode = this.importMode();
    const message = mode === 'replace'
      ? `Import ${parsed.length} rule(s) in REPLACE mode. All ${this.rules().length} existing rule(s) will be DELETED first. Continue?`
      : `Import ${parsed.length} rule(s) in append mode (existing rules untouched). Continue?`;
    const confirmed = await this.dialogUtils.openConfirmDialog('Import tax rules', message, 'Import', 'Cancel').catch(() => false);
    if (!confirmed) return;

    try {
      const result = await firstValueFrom(
        this.importExportService.importRules(parsed as TaxRule[], mode).pipe(this.rxjsUtils.waitLoadingDialog())
      );
      this.dialogUtils.openErrorMessage(
        'Import complete',
        `Imported ${result.imported} rule(s)` + (result.replaced ? `, replaced ${result.replaced}.` : '.')
      );
      this.refresh();
    } catch (err) {
      this.dialogUtils.openErrorMessageFromError(err);
    }
  }
}
