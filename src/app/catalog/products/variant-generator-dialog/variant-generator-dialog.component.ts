import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { AttributeDefinition, AttributeOption, ProductAttributeType } from '../../../shared/model/attribute.model';
import { GenerateVariantsResponse } from '../../../shared/model/product.model';
import { VariantGeneratorService } from '../../../shared/service/variant-generator/variant-generator.service';

export interface VariantGeneratorDialogData {
  productId: string;
  baseSku: string;
  // Full definition pool — the dialog filters to SELECT/MULTI_SELECT itself.
  definitions: AttributeDefinition[];
}

// Cartesian variant generator (intent § 3/§ 11). Pick one or more SELECT-type
// definitions as axes, optionally narrow each axis's options, preview the
// combination count, then let the SERVER mint the variants
// (POST /products/{id}/generate-variants — idempotent, skips existing SKUs).
// Closes with the GenerateVariantsResponse so the caller can swap in the
// updated product graph without a re-fetch.
//
// Deliberately plain `mat-select multiple` rather than the lib's
// <app-mat-form-field-input-list-option>: that widget is an expansion panel
// whose "Add new item" clones option VALUES into the bound array and whose
// getOptons() mutates option state during template evaluation — inside a
// dialog under zoneless CD that fed an infinite re-render loop (FE-13), and
// the collapsed panel was invisible anyway (FE-15). Multi-selects with stable
// object references have neither problem.
@Component({
  selector: 'app-variant-generator-dialog',
  templateUrl: './variant-generator-dialog.component.html',
  styleUrls: ['./variant-generator-dialog.component.scss'],
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule]
})
export class VariantGeneratorDialog {

  private dialogRef = inject(MatDialogRef<VariantGeneratorDialog, GenerateVariantsResponse | undefined>);
  private data = inject<VariantGeneratorDialogData>(MAT_DIALOG_DATA);
  private generatorService = inject(VariantGeneratorService);
  private rxjsUtils = inject(RxJSUtils);
  private dialogUtils = inject(DialogUtils);

  // Only definitions that can act as axes (need options to combine). Stable
  // array — mat-select options compare by reference against it.
  readonly selectableDefinitions = this.data.definitions.filter(
    d => (d.type === ProductAttributeType.SELECT || d.type === ProductAttributeType.MULTI_SELECT)
      && (d.options?.length ?? 0) > 0
  );

  // Chosen axes, in pick order; per-axis picked options keyed by definition id
  // (defaults to ALL options when an axis is added).
  axes = signal<AttributeDefinition[]>([]);
  pickedOptions = signal<Record<string, AttributeOption[]>>({});

  baseSku = this.data.baseSku || '(product id prefix)';

  comboCount = computed<number>(() =>
    this.axes().reduce((acc, def) => acc * (this.pickedOptions()[def.id]?.length || 0), this.axes().length ? 1 : 0)
  );

  previewSku = computed<string>(() => {
    const parts = this.axes()
      .map(def => this.pickedOptions()[def.id]?.[0])
      .map(o => (o ? this.sanitize(o.value) : 'OPT'));
    return parts.length ? `${this.baseSku}-${parts.join('-')} …` : '';
  });

  canGenerate = computed<boolean>(() => this.comboCount() > 0 && this.comboCount() <= 500);

  onAxesChange(defs: AttributeDefinition[]) {
    const next = defs ?? [];
    this.axes.set(next);
    // Seed newly-added axes with all options; drop removed axes' picks.
    const picks = { ...this.pickedOptions() };
    for (const def of next) {
      if (!picks[def.id]) picks[def.id] = [...(def.options ?? [])];
    }
    for (const id of Object.keys(picks)) {
      if (!next.some(d => d.id === id)) delete picks[id];
    }
    this.pickedOptions.set(picks);
  }

  onAxisOptionsChange(def: AttributeDefinition, options: AttributeOption[]) {
    this.pickedOptions.set({ ...this.pickedOptions(), [def.id]: options ?? [] });
  }

  pickedFor(def: AttributeDefinition): AttributeOption[] {
    // Stable reference out of the record — safe to bind from the template.
    return this.pickedOptions()[def.id] ?? [];
  }

  optionLabel(o: AttributeOption): string {
    return o.displayValue || o.value;
  }

  defLabel(d: AttributeDefinition): string {
    return d.displayName || d.name;
  }

  generate() {
    if (!this.canGenerate()) return;
    const request = {
      axes: this.axes().map(def => {
        const picked = this.pickedOptions()[def.id] ?? [];
        const all = def.options ?? [];
        return {
          attributeDefinitionId: def.id,
          // Omit optionIds when every option is picked — "all" is the server default.
          ...(picked.length === all.length ? {} : { optionIds: picked.map(o => o.id) })
        };
      })
    };
    this.generatorService.generate(this.data.productId, request)
      .pipe(this.rxjsUtils.waitLoadingDialog())
      .subscribe({
        next: res => this.dialogRef.close(res),
        error: err => this.dialogUtils.openErrorMessageFromError(err)
      });
  }

  cancel() {
    this.dialogRef.close(undefined);
  }

  private sanitize(value: string | undefined): string {
    const cleaned = (value ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return cleaned || 'OPT';
  }
}
