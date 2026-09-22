import { Component, computed, inject, signal } from '@angular/core';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesRestApi } from '../../../../lib/abtract/ViesRestApi';
import { RouteUtils } from '../../../../lib/util/Route.utils';
import { SnackBarUtils } from '../../../../lib/util/SnackBar.utils';
import { AuthenticatorService } from '../../../../lib/service/authenticator.service';
import { APP_ROUTES } from '../../../app.routes';
import { PageSection, StorefrontPage } from '../../../shared/model/storefront.model';
import { StorefrontPageService, StorefrontService } from '../../../shared/service/storefront/storefront.service';
import { SectionsEditorComponent } from '../../../shared/component/storefront/sections-editor.component';
import { HistoryPanelComponent } from '../../../shared/component/history-panel/history-panel.component';

// Page editor on the lib REST base: dynamic form for the header fields,
// sections editor for the draft, publish / discard actions.
@Component({
  selector: 'app-storefront-page',
  imports: [NgComponentModule, SectionsEditorComponent, HistoryPanelComponent],
  templateUrl: './storefront-page.component.html',
  styles: [`.return-banner { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; padding: 0.75rem 1rem; margin-bottom: 1rem; border-left: 4px solid var(--mat-sys-primary, #7c4dff); background: var(--mat-sys-surface-container-low, rgba(255,255,255,0.03)); border-radius: 4px; } .status { font-size: 0.9rem; opacity: 0.85; margin: 0.5rem 0; } .section-title { margin: 1rem 0 0.5rem; }`]
})
export class StorefrontPageComponent extends ViesRestApi<StorefrontPage, StorefrontPageService> {
  service = inject(StorefrontPageService);
  private readonly sf = inject(StorefrontService);
  private readonly authenticatorService = inject(AuthenticatorService);
  validForm = signal<boolean>(false);
  canUpdate = computed<boolean>(() => this.authenticatorService.hasAuthorityOrAdmin('storefront:update'));
  isHome = computed<boolean>(() => this.value()?.slug === 'home');
  unpublishedChanges = computed<boolean>(() => { const p = this.value(); return !!p && JSON.stringify(p.draftSections) !== JSON.stringify(p.publishedSections ?? []); });

  override getRouteId() { const id = RouteUtils.getPathVariable('pages'); return id === 'new' ? null : id; }
  protected override afterSave(res: StorefrontPage, wasCreate: boolean): void {
    if (wasCreate && res.id) this.router.navigate([APP_ROUTES.systemStorefrontPage(res.id)], { replaceUrl: true });
    SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, 'Draft saved', 'Dismiss', 3000);
  }
  onMainFormChange(v: StorefrontPage) { const cur = this.value(); this.value.set({ ...v, draftSections: cur?.draftSections ?? [], publishedSections: cur?.publishedSections, publishedAt: cur?.publishedAt }); }
  onSections(s: PageSection[]) { const cur = this.value(); if (cur) this.value.set({ ...cur, draftSections: s }); }

  async publish() {
    const id = this.id(); if (!id) return;
    if (this._value.isValueChange()) { SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, 'Save the draft first', 'Dismiss', 3000); return; }
    const ok = await this.dialogUtils.openConfirmDialog('Publish?', 'Customers will see the draft sections immediately.', 'Publish', 'Cancel').catch(() => false);
    if (ok) this.sf.publishPage(id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({ next: p => { this._value.set(p); SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, 'Published', 'Dismiss', 3000); }, error: err => this.dialogUtils.openErrorMessageFromError(err) });
  }
  async discard() {
    const id = this.id(); if (!id) return;
    const ok = await this.dialogUtils.openConfirmDialog('Discard draft?', 'The draft goes back to the published copy.', 'Discard', 'Keep').catch(() => false);
    if (ok) this.sf.discardPageDraft(id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({ next: p => this._value.set(p), error: err => this.dialogUtils.openErrorMessageFromError(err) });
  }
  preview() { this.router.navigate([APP_ROUTES.systemStorefrontPreview], { queryParams: { draft: true } }); }
  back() { this.router.navigate([APP_ROUTES.systemStorefrontPages]); }
}
