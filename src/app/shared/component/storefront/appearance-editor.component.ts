import { Component, input, output } from '@angular/core';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { ViesDateTime } from '../../../../lib/model/vies.model';
import { AssetOwnerType, SfAnnouncement, SfFooter, SfHeader, SfSeo, SfTheme, StorefrontAppearance } from '../../model/storefront.model';
import { AssetPickerComponent } from './asset-picker.component';

export type AppearancePart = 'theme' | 'brand' | 'header' | 'footer' | 'announcement' | 'seo';

// Each appearance part is a decorated class rendered by the lib dynamic form
// (colours → lib colour picker, lists → lib list widget, toggles, enums).
// Only the announcement window and the brand images need explicit widgets.
@Component({
  selector: 'app-appearance-editor',
  imports: [NgComponentModule, AssetPickerComponent],
  templateUrl: './appearance-editor.component.html',
  styles: [`.window { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin: 0.25rem 0; }`]
})
export class AppearanceEditorComponent extends ViesMatFormFieldMap {
  value = input.required<StorefrontAppearance>();
  parts = input<AppearancePart[]>(['theme', 'brand', 'header', 'footer', 'announcement', 'seo']);
  ownerType = input<AssetOwnerType>('SETTINGS');
  ownerId = input<string | null | undefined>(null);
  disabled = input<boolean>(false);
  valueChange = output<StorefrontAppearance>();

  readonly blankTheme = new SfTheme();
  readonly blankHeader = new SfHeader();
  readonly blankFooter = new SfFooter();
  readonly blankAnnouncement = new SfAnnouncement();
  readonly blankSeo = new SfSeo();

  show(p: AppearancePart): boolean { return this.parts().includes(p); }
  set<K extends keyof StorefrontAppearance>(part: K, v: StorefrontAppearance[K]) { this.valueChange.emit({ ...this.value(), [part]: v }); }
  setAnnouncementWindow(key: 'startsAt' | 'endsAt', dt?: ViesDateTime) { this.set('announcement', Object.assign(new SfAnnouncement(), this.value().announcement, { [key]: dt })); }
  setBrand(key: 'faviconAssetId' | 'shareImageAssetId', id: string | null) { this.set('brand', { ...this.value().brand, [key]: id }); }
  fields(name: string, width = '100%') { return this.inputField(name).set(this.inputKeys.indent, false).set(this.inputKeys.styleWidth, width).set(this.inputKeys.disable, this.disabled()); }
}
