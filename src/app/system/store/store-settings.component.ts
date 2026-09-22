import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../lib/abtract/ViesMatFormFieldMap';
import { ViesService } from '../../../lib/service/rest.service';
import { RxJSUtils } from '../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../lib/util/Dialog.utils';
import { SnackBarUtils } from '../../../lib/util/SnackBar.utils';
import { AuthenticatorService } from '../../../lib/service/authenticator.service';
import { Address, AddressType } from '../../shared/model/address.model';
import { StoreSettings } from '../../shared/model/store-settings.model';
import { StoreSettingsService } from '../../shared/service/store-settings/store-settings.service';
import { HistoryPanelComponent } from '../../shared/component/history-panel/history-panel.component';

// Settings → Store (/system/store): the one settings row (decorator form +
// address) and the logo (object storage, like digital assets).
@Component({
  selector: 'app-store-settings',
  templateUrl: './store-settings.component.html',
  styleUrls: ['./store-settings.component.scss'],
  imports: [NgComponentModule, HistoryPanelComponent]
})
export class StoreSettingsComponent extends ViesMatFormFieldMap implements OnInit {

  private readonly rxjsUtils = inject(RxJSUtils);
  private readonly dialogUtils = inject(DialogUtils);
  private readonly service = inject(StoreSettingsService);
  private readonly authenticatorService = inject(AuthenticatorService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly blank = new StoreSettings();
  readonly blankAddress = new Address();
  baseline = signal<string>('');
  value = signal<StoreSettings | null>(null);
  validForm = signal<boolean>(false);
  logoUrl = signal<SafeUrl | null>(null);
  busy = signal<boolean>(false);

  canUpdate = computed<boolean>(() => this.authenticatorService.hasAuthorityOrAdmin('settings:update'));
  dirty = computed<boolean>(() => JSON.stringify(this.value()) !== this.baseline());
  addressValue = computed<Address>(() => this.value()?.address ?? new Address());

  ngOnInit(): void {
    if (ViesService.isNotCSR()) return;
    this.load();
  }

  load() {
    this.service.get().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: s => this.apply(s),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  private apply(s: StoreSettings) {
    const v = { ...this.blank, ...s, address: { ...new Address(), ...(s.address ?? {}) } } as StoreSettings;
    this.value.set(v);
    this.baseline.set(JSON.stringify(v));
    this.loadLogo(!!s.logoObjectId);
  }

  private loadLogo(has: boolean) {
    if (!has) { this.logoUrl.set(null); return; }
    this.service.logoBlob().subscribe({
      next: blob => this.logoUrl.set(this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob))),
      error: () => this.logoUrl.set(null)
    });
  }

  onMainFormChange(v: StoreSettings) {
    const cur = this.value();
    this.value.set({ ...v, address: cur?.address ?? new Address(), logoObjectId: cur?.logoObjectId, logoPath: cur?.logoPath, logoContentType: cur?.logoContentType, id: cur?.id ?? '' });
  }

  onAddressChange(a: Address) {
    const v = this.value(); if (!v) return;
    this.value.set({ ...v, address: { ...a, type: AddressType.SHIPPING } });
  }

  save() {
    const v = this.value(); if (!v || !this.dirty()) return;
    this.busy.set(true);
    this.service.update(v).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: s => { this.busy.set(false); this.apply(s); SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, 'Store settings saved', 'Dismiss', 3000); },
      error: err => { this.busy.set(false); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  revert() { const b = this.baseline(); if (b) this.value.set(JSON.parse(b)); }

  onLogoPicked(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input.files?.[0]; input.value = '';
    if (!file) return;
    this.busy.set(true);
    this.service.uploadLogo(file).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: s => { this.busy.set(false); this.apply({ ...this.value()!, logoObjectId: s.logoObjectId, logoPath: s.logoPath, logoContentType: s.logoContentType }); SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, 'Logo uploaded', 'Dismiss', 3000); },
      error: err => { this.busy.set(false); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }

  async removeLogo() {
    const ok = await this.dialogUtils.openConfirmDialog('Remove logo?', 'The storefront and receipts fall back to the store name.', 'Remove', 'Cancel').catch(() => false);
    if (!ok) return;
    this.service.deleteLogo().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: s => this.apply({ ...this.value()!, logoObjectId: s.logoObjectId, logoPath: s.logoPath, logoContentType: s.logoContentType }),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
}
