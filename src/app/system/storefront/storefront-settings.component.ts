import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../lib/abtract/ViesMatFormFieldMap';
import { ViesService } from '../../../lib/service/rest.service';
import { RxJSUtils } from '../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../lib/util/Dialog.utils';
import { SnackBarUtils } from '../../../lib/util/SnackBar.utils';
import { AuthenticatorService } from '../../../lib/service/authenticator.service';
import { APP_ROUTES } from '../../app.routes';
import { StorefrontAppearance, StorefrontBehaviour } from '../../shared/model/storefront.model';
import { StorefrontService } from '../../shared/service/storefront/storefront.service';
import { AppearanceEditorComponent } from '../../shared/component/storefront/appearance-editor.component';

// Settings → Storefront: the DEFAULT look (§12.1) and behaviour toggles (§12.3).
// Pages and templates have their own screens.
@Component({
  selector: 'app-storefront-settings',
  templateUrl: './storefront-settings.component.html',
  styleUrls: ['./storefront-settings.component.scss'],
  imports: [NgComponentModule, AppearanceEditorComponent]
})
export class StorefrontSettingsComponent extends ViesMatFormFieldMap implements OnInit {
  private readonly rxjsUtils = inject(RxJSUtils);
  private readonly dialogUtils = inject(DialogUtils);
  private readonly sf = inject(StorefrontService);
  private readonly authenticatorService = inject(AuthenticatorService);
  private readonly router = inject(Router);

  appearance = signal<StorefrontAppearance | null>(null);
  behaviour = signal<StorefrontBehaviour | null>(null);
  baseline = signal<string>('');
  busy = signal<boolean>(false);
  canUpdate = computed<boolean>(() => this.authenticatorService.hasAuthorityOrAdmin('storefront:update'));
  dirty = computed<boolean>(() => JSON.stringify({ a: this.appearance(), b: this.behaviour() }) !== this.baseline());

  ngOnInit(): void { if (ViesService.isNotCSR()) return; this.load(); }

  load() {
    this.sf.getSettings().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: d => this.apply(d.appearance, d.behaviour),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
  readonly blankBehaviour = new StorefrontBehaviour();
  private apply(a: StorefrontAppearance, b: StorefrontBehaviour) {
    this.appearance.set(a); this.behaviour.set(b);
    this.baseline.set(JSON.stringify({ a, b }));
  }

  save() {
    const a = this.appearance(), b = this.behaviour(); if (!a || !b || !this.dirty()) return;
    this.busy.set(true);
    this.sf.updateSettings({ appearance: a, behaviour: b }).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: d => { this.busy.set(false); this.apply(d.appearance, d.behaviour); SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, 'Storefront settings saved — live immediately', 'Dismiss', 4000); },
      error: err => { this.busy.set(false); this.dialogUtils.openErrorMessageFromError(err); }
    });
  }
  revert() { this.load(); }
  preview() { this.router.navigate([APP_ROUTES.systemStorefrontPreview]); }
  pages() { this.router.navigate([APP_ROUTES.systemStorefrontPages]); }
  templates() { this.router.navigate([APP_ROUTES.systemStorefrontTemplates]); }
}
