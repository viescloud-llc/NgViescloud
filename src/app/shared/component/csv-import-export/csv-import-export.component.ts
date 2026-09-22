import { Component, computed, inject, input, output, signal } from '@angular/core';
import { MatRadioModule } from '@angular/material/radio';
import { Observable } from 'rxjs';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { FileUtils } from '../../../../lib/util/File.utils';
import { ImportResult } from '../../model/bulk.model';

export interface CsvModeOption { value: string; label: string; hint: string; }

// Reusable "Export CSV / Import CSV" block. Import flow: pick a file → the
// server DRY-RUNS it (nothing written) → the plan is shown (counts, first
// changes, every error) → "Apply" runs it for real. Imports are all-or-nothing.
@Component({
  selector: 'app-csv-import-export',
  templateUrl: './csv-import-export.component.html',
  styleUrls: ['./csv-import-export.component.scss'],
  imports: [NgComponentModule, MatRadioModule]
})
export class CsvImportExportComponent extends ViesMatFormFieldMap {

  private readonly rxjsUtils = inject(RxJSUtils);
  private readonly dialogUtils = inject(DialogUtils);

  /** e.g. "products.csv" */
  fileName = input.required<string>();
  title = input<string>('Import / export CSV');
  hint = input<string>('');
  /** Column list shown to the user. */
  columns = input<string>('');
  canImport = input<boolean>(true);
  canExport = input<boolean>(true);
  /** Optional mode radio (e.g. stock set/add). */
  modes = input<CsvModeOption[]>([]);
  exportFn = input.required<() => Observable<string>>();
  /** (csvText, dryRun, mode) → result */
  importFn = input.required<(csv: string, dryRun: boolean, mode: string) => Observable<ImportResult>>();
  applied = output<ImportResult>();

  mode = signal<string>('');
  csvText = signal<string>('');
  pickedName = signal<string>('');
  preview = signal<ImportResult | null>(null);
  busy = signal<boolean>(false);
  showAllChanges = signal<boolean>(false);

  currentMode = computed<string>(() => this.mode() || this.modes()[0]?.value || '');
  visibleChanges = computed(() => {
    const p = this.preview();
    if (!p) return [];
    const real = p.changes.filter(c => c.action !== 'UNCHANGED');
    return this.showAllChanges() ? real : real.slice(0, 25);
  });
  hiddenCount = computed<number>(() => { const p = this.preview(); if (!p) return 0; const real = p.changes.filter(c => c.action !== 'UNCHANGED').length; return this.showAllChanges() ? 0 : Math.max(0, real - 25); });

  exportCsv() {
    this.busy.set(true);
    this.exportFn()().subscribe({
      next: text => { this.busy.set(false); FileUtils.saveFile(this.fileName(), 'text/csv', text); },
      error: err => { this.busy.set(false); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  async onFilePicked(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const text = await file.text();
    this.csvText.set(text);
    this.pickedName.set(file.name);
    this.dryRun();
  }

  dryRun() {
    if (!this.csvText()) return;
    this.busy.set(true);
    this.showAllChanges.set(false);
    this.importFn()(this.csvText(), true, this.currentMode()).subscribe({
      next: r => { this.busy.set(false); this.preview.set(r); },
      error: err => { this.busy.set(false); this.preview.set(null); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  onMode(v: string) { this.mode.set(v); if (this.csvText()) this.dryRun(); }

  async apply() {
    const p = this.preview();
    if (!p || p.errors.length > 0 || !this.csvText()) return;
    const ok = await this.dialogUtils.openConfirmDialog('Apply import?', `${p.created} to create, ${p.updated} to update/adjust, ${p.unchanged} unchanged from "${this.pickedName()}". This writes to the database.`, 'Apply', 'Cancel').catch(() => false);
    if (!ok) return;
    this.busy.set(true);
    this.importFn()(this.csvText(), false, this.currentMode()).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: r => {
        this.busy.set(false); this.preview.set(r);
        if (r.applied) { this.applied.emit(r); this.csvText.set(''); }
      },
      error: err => { this.busy.set(false); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  clear() { this.csvText.set(''); this.pickedName.set(''); this.preview.set(null); }
}
