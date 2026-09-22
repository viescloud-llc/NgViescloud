import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesRestApi } from '../../../../lib/abtract/ViesRestApi';
import { RouteUtils } from '../../../../lib/util/Route.utils';
import { SnackBarUtils } from '../../../../lib/util/SnackBar.utils';
import { AuthenticatorService } from '../../../../lib/service/authenticator.service';
import { APP_ROUTES } from '../../../app.routes';
import { PageSection, StorefrontAppearance, StorefrontTemplate } from '../../../shared/model/storefront.model';
import { StorefrontService, StorefrontTemplateService } from '../../../shared/service/storefront/storefront.service';
import { AppearanceEditorComponent } from '../../../shared/component/storefront/appearance-editor.component';
import { SectionsEditorComponent } from '../../../shared/component/storefront/sections-editor.component';
import { AssetPickerComponent } from '../../../shared/component/storefront/asset-picker.component';
import { HistoryPanelComponent } from '../../../shared/component/history-panel/history-panel.component';

// Template editor on the lib REST base: the dynamic form renders name /
// description / override toggles; tabs hold the overlaid parts.
@Component({
  selector: 'app-storefront-template',
  imports: [NgComponentModule, AppearanceEditorComponent, SectionsEditorComponent, AssetPickerComponent, HistoryPanelComponent],
  templateUrl: './storefront-template.component.html',
  styles: [`.return-banner { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; padding: 0.75rem 1rem; margin-bottom: 1rem; border-left: 4px solid var(--mat-sys-primary, #7c4dff); background: var(--mat-sys-surface-container-low, rgba(255,255,255,0.03)); border-radius: 4px; } .tab-body { padding: 1rem 0.25rem; } .inherit { opacity: 0.7; font-style: italic; margin: 0.5rem 0; } .status { font-size: 0.9rem; opacity: 0.85; margin: 0.5rem 0; }`]
})
export class StorefrontTemplateComponent extends ViesRestApi<StorefrontTemplate, StorefrontTemplateService> implements OnInit {
  service = inject(StorefrontTemplateService);
  private readonly sf = inject(StorefrontService);
  private readonly authenticatorService = inject(AuthenticatorService);
  validForm = signal<boolean>(false);
  canUpdate = computed<boolean>(() => this.authenticatorService.hasAuthorityOrAdmin('storefront:update'));
  unpublishedChanges = computed<boolean>(() => { const t = this.value(); return !!t && !!t.publishedAt && (JSON.stringify(t.draftAppearance) !== JSON.stringify(t.publishedAppearance) || JSON.stringify(t.draftHomeSections) !== JSON.stringify(t.publishedHomeSections)); });

  override getRouteId() { const id = RouteUtils.getPathVariable('templates'); return id === 'new' ? null : id; }
  override ngOnInit(): void {
    super.ngOnInit();
    // A new template starts from the current default look, so the admin edits from something real.
    if (!this.getRouteId()) this.sf.getSettings().subscribe({ next: d => { const t = this.value(); if (t) this._value.set({ ...t, draftAppearance: d.appearance }); }, error: () => {} });
  }
  protected override afterSave(res: StorefrontTemplate, wasCreate: boolean): void {
    if (wasCreate && res.id) this.router.navigate([APP_ROUTES.systemStorefrontTemplate(res.id)], { replaceUrl: true });
    SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, 'Draft saved', 'Dismiss', 3000);
  }
  onMainFormChange(v: StorefrontTemplate) {
    const cur = this.value();
    this.value.set({ ...v, draftAppearance: cur?.draftAppearance ?? v.draftAppearance, draftHomeSections: cur?.draftHomeSections ?? [], publishedAppearance: cur?.publishedAppearance, publishedHomeSections: cur?.publishedHomeSections, publishedAt: cur?.publishedAt });
  }
  onAppearance(a: StorefrontAppearance) { const t = this.value(); if (t) this.value.set({ ...t, draftAppearance: a }); }
  onSections(s: PageSection[]) { const t = this.value(); if (t) this.value.set({ ...t, draftHomeSections: s }); }

  private action(label: string, call: () => ReturnType<StorefrontService['publishTemplate']>) {
    call().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({ next: t => { this._value.set(t); SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, label, 'Dismiss', 3000); }, error: err => this.dialogUtils.openErrorMessageFromError(err) });
  }
  async publish() { const id = this.id(); if (!id) return; if (this._value.isValueChange()) { SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, 'Save the draft first', 'Dismiss', 3000); return; } const ok = await this.dialogUtils.openConfirmDialog('Publish template?', 'The published copy is what schedules activate. If this template is live now, customers see the change immediately.', 'Publish', 'Cancel').catch(() => false); if (ok) this.action('Published', () => this.sf.publishTemplate(id)); }
  async discard() { const id = this.id(); if (!id) return; const ok = await this.dialogUtils.openConfirmDialog('Discard draft?', 'Back to the published copy.', 'Discard', 'Keep').catch(() => false); if (ok) this.action('Draft discarded', () => this.sf.discardTemplateDraft(id)); }
  duplicate() { const id = this.id(); if (!id) return; this.sf.duplicateTemplate(id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({ next: t => t.id && this.router.navigate([APP_ROUTES.systemStorefrontTemplate(t.id)]), error: err => this.dialogUtils.openErrorMessageFromError(err) }); }
  async activateNow() { const id = this.id(); if (!id) return; const ok = await this.dialogUtils.openConfirmDialog('Make this template live now?', 'Publishes it if needed and opens an open-ended window with top priority. "Back to default" ends it.', 'Activate', 'Cancel').catch(() => false); if (!ok) return; this.sf.activateNow(id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({ next: () => { SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, 'Template is live', 'Dismiss', 4000); this.service.get(id).subscribe({ next: t => this._value.set(t) }); }, error: err => this.dialogUtils.openErrorMessageFromError(err) }); }
  deactivate() { const id = this.id(); if (!id) return; this.sf.deactivate(id).subscribe({ next: r => SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, r.ended ? 'Back to the default look' : 'This template was not live', 'Dismiss', 4000), error: err => this.dialogUtils.openErrorMessageFromError(err) }); }
  preview(draft: boolean) { const id = this.id(); if (!id) return; this.router.navigate([APP_ROUTES.systemStorefrontPreview], { queryParams: { templateId: id, draft } }); }
  back() { this.router.navigate([APP_ROUTES.systemStorefrontTemplates]); }
}
