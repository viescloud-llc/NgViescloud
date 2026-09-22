import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { AssetOwnerType, StorefrontAsset } from '../../model/storefront.model';
import { StorefrontService } from '../../service/storefront/storefront.service';

// Pick (or upload) one storefront image for an owner (default look, a template, a page).
@Component({
  selector: 'app-asset-picker',
  imports: [NgComponentModule],
  template: `
    <div class="picker">
      @if (label()) { <span class="lbl">{{ label() }}</span> }
      @if (value(); as id) { <img class="thumb" [src]="sf.assetUrl(id)" alt="" /> <button matButton (click)="valueChange.emit(null)" type="button" [disabled]="disabled()">Clear</button> }
      @else { <span class="none">none</span> }
      <label matButton class="file-picker-btn" [class.off]="disabled()">Upload…<input type="file" accept="image/*" (change)="onPicked($event)" hidden [disabled]="disabled()" /></label>
      @if (assets().length > 0) {
        <button matButton (click)="open.set(!open())" type="button">{{ open() ? 'Hide' : 'Choose existing (' + assets().length + ')' }}</button>
      }
    </div>
    @if (open()) {
      <div class="gallery">
        @for (a of assets(); track a.id) {
          <button class="tile" [class.sel]="a.id === value()" (click)="valueChange.emit(a.id); open.set(false)" type="button" [disabled]="disabled()">
            <img [src]="a.url" [alt]="a.fileName" /><small>{{ a.label || a.fileName }}</small>
          </button>
        }
      </div>
    }
  `,
  styles: [`
    .picker { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin: 0.25rem 0; }
    .lbl { min-width: 120px; opacity: 0.85; } .none { opacity: 0.6; }
    .thumb { height: 40px; max-width: 120px; object-fit: contain; background: #fff; border-radius: 4px; }
    .file-picker-btn { cursor: pointer; &.off { opacity: 0.5; pointer-events: none; } }
    .gallery { display: flex; gap: 0.5rem; flex-wrap: wrap; margin: 0.25rem 0 0.75rem; }
    .tile { width: 110px; border: 2px solid transparent; border-radius: 6px; background: var(--mat-sys-surface-container-low, rgba(255,255,255,0.05)); padding: 0.25rem; cursor: pointer; color: inherit; &.sel { border-color: var(--mat-sys-primary, #7c4dff); } img { width: 100%; height: 60px; object-fit: contain; background: #fff; border-radius: 4px; } small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } }
  `]
})
export class AssetPickerComponent implements OnInit {
  readonly sf = inject(StorefrontService);
  private readonly dialogUtils = inject(DialogUtils);
  ownerType = input<AssetOwnerType>('SETTINGS');
  ownerId = input<string | null | undefined>(null);
  label = input<string>('');
  value = input<string | null | undefined>(null);
  disabled = input<boolean>(false);
  valueChange = output<string | null>();
  assets = signal<StorefrontAsset[]>([]);
  open = signal<boolean>(false);
  canUpload = computed<boolean>(() => this.ownerType() === 'SETTINGS' || !!this.ownerId());

  ngOnInit(): void { this.refresh(); }
  refresh() {
    if (!this.canUpload()) return;
    this.sf.assets(this.ownerType(), this.ownerId()).subscribe({ next: a => this.assets.set(a ?? []), error: () => {} });
  }
  onPicked(evt: Event) {
    const input = evt.target as HTMLInputElement; const file = input.files?.[0]; input.value = '';
    if (!file) return;
    if (!this.canUpload()) { this.dialogUtils.openErrorMessage('Save first', 'Save the template/page once so images can be attached to it.'); return; }
    this.sf.uploadAsset(this.ownerType(), this.ownerId(), file).subscribe({
      next: a => { this.assets.set([...this.assets(), a]); this.valueChange.emit(a.id); },
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
}
