import { Component, input, output, signal } from '@angular/core';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { MatOption } from '../../../../lib/model/mat.model';
import { AssetOwnerType, PageSection, PromoTile, SECTION_LABELS, SectionType, blankSettingsFor } from '../../model/storefront.model';
import { AssetPickerComponent } from './asset-picker.component';
import { ProductSelectorComponent } from './product-selector.component';

// Ordered list of page sections. Each section's settings are a decorated
// class (HeroSettings, …) rendered by the lib dynamic form; images use the
// asset picker and FEATURED_PRODUCTS the product selector.
@Component({
  selector: 'app-sections-editor',
  imports: [NgComponentModule, AssetPickerComponent, ProductSelectorComponent],
  templateUrl: './sections-editor.component.html',
  styles: [`
    .section { border: 1px solid var(--mat-sys-outline-variant, rgba(255,255,255,0.15)); border-radius: 6px; margin-bottom: 0.75rem; &.off { opacity: 0.6; } }
    .head { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.75rem; background: var(--mat-sys-surface-container-low, rgba(255,255,255,0.04)); cursor: pointer; .title { flex: 1; } small { opacity: 0.7; } }
    .body { padding: 0.5rem 0.75rem 0.75rem; }
    .tile { border-top: 1px dashed var(--mat-sys-outline-variant, rgba(255,255,255,0.15)); padding-top: 0.4rem; margin-top: 0.4rem; }
    .add { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
  `]
})
export class SectionsEditorComponent extends ViesMatFormFieldMap {
  sections = input.required<PageSection[]>();
  ownerType = input<AssetOwnerType>('PAGE');
  ownerId = input<string | null | undefined>(null);
  disabled = input<boolean>(false);
  sectionsChange = output<PageSection[]>();

  readonly typeOptions: MatOption<SectionType>[] = (Object.values(SectionType) as SectionType[]).map(t => ({ value: t, valueLabel: SECTION_LABELS[t] }));
  addType = signal<SectionType>(SectionType.HERO);
  openIdx = signal<number>(-1);
  readonly blankFor = blankSettingsFor;
  readonly labels = SECTION_LABELS;

  private emit(list: PageSection[]) { this.sectionsChange.emit(list); }
  add() {
    const type = this.addType();
    const list = [...this.sections(), { id: Math.random().toString(36).slice(2, 10), type, enabled: true, settings: blankSettingsFor(type) as Record<string, any> }];
    this.emit(list); this.openIdx.set(list.length - 1);
  }
  remove(i: number) { this.emit(this.sections().filter((_, x) => x !== i)); this.openIdx.set(-1); }
  move(i: number, d: number) { const list = [...this.sections()]; const j = i + d; if (j < 0 || j >= list.length) return; [list[i], list[j]] = [list[j], list[i]]; this.emit(list); this.openIdx.set(j); }
  toggle(i: number, on: boolean) { this.emit(this.sections().map((s, x) => x === i ? { ...s, enabled: on } : s)); }
  setSettings(i: number, settings: object) { this.emit(this.sections().map((s, x) => x === i ? { ...s, settings: settings as Record<string, any> } : s)); }
  setSetting(i: number, key: string, v: unknown) { const s = this.sections()[i]; this.setSettings(i, Object.assign(blankSettingsFor(s.type), s.settings, { [key]: v })); }
  setTileImage(i: number, t: number, id: string | null) {
    const s = this.sections()[i]; const tiles = [...((s.settings['tiles'] as PromoTile[]) ?? [])]; tiles[t] = Object.assign(new PromoTile(), tiles[t], { imageAssetId: id });
    this.setSetting(i, 'tiles', tiles);
  }
  fields(name: string) { return this.inputField(name).set(this.inputKeys.indent, false).set(this.inputKeys.styleWidth, '100%').set(this.inputKeys.disable, this.disabled()); }
}
