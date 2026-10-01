import { Component, computed, inject, signal } from '@angular/core';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { ViesRestApi } from '../../../../lib/abtract/ViesRestApi';
import { RouteUtils } from '../../../../lib/util/Route.utils';
import { SnackBarUtils } from '../../../../lib/util/SnackBar.utils';
import { AuthenticatorService } from '../../../../lib/service/authenticator.service';
import { APP_ROUTES } from '../../../app.routes';
import { isSystemRole, PAGE_ROLE_LABELS, PageBody, PageBodyRow, PageRole, PageSection, StorefrontPage } from '../../../shared/model/storefront.model';
import { MatOption } from '../../../../lib/model/mat.model';
import { StorefrontPageService, StorefrontService } from '../../../shared/service/storefront/storefront.service';
import { SectionsEditorComponent } from '../../../shared/component/storefront/sections-editor.component';
import { HistoryPanelComponent } from '../../../shared/component/history-panel/history-panel.component';

// Page editor on the lib REST base: dynamic form for the header fields,
// sections editor for the draft, publish / discard actions.
@Component({
  selector: 'app-storefront-page',
  imports: [NgComponentModule, SectionsEditorComponent, HistoryPanelComponent],
  templateUrl: './storefront-page.component.html',
  styles: [`.return-banner { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; padding: 0.75rem 1rem; margin-bottom: 1rem; border-left: 4px solid var(--mat-sys-primary, #7c4dff); background: var(--mat-sys-surface-container-low, rgba(255,255,255,0.03)); border-radius: 4px; } .status { font-size: 0.9rem; opacity: 0.85; margin: 0.5rem 0; } .section-title { margin: 1rem 0 0.5rem; } .tab-body { padding: 1rem 0.25rem; } .row { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin: 0.25rem 0; } .live { color: #4caf50; font-weight: 600; } .unsaved { color: var(--mat-sys-tertiary, #ffd54f); }`]
})
export class StorefrontPageComponent extends ViesRestApi<StorefrontPage, StorefrontPageService> {
  service = inject(StorefrontPageService);
  private readonly sf = inject(StorefrontService);
  private readonly authenticatorService = inject(AuthenticatorService);
  validForm = signal<boolean>(false);
  canUpdate = computed<boolean>(() => this.authenticatorService.hasAuthorityOrAdmin('storefront:update'));
  isHome = computed<boolean>(() => this.value()?.role === PageRole.HOME);
  isSystem = computed<boolean>(() => isSystemRole(this.value()?.role));
  readonly roleOptions: MatOption<PageRole>[] = (Object.values(PageRole) as PageRole[]).map(r => ({ value: r, valueLabel: PAGE_ROLE_LABELS[r] }));
  onRole(r: PageRole) { const cur = this.value(); if (cur) this.value.set({ ...cur, role: r }); }

  // ---- Bodies: named versions of the content; one is live ----
  bodies = signal<PageBody[]>([]);
  selectedId = signal<string | null>(null);
  editing = signal<PageBody | null>(null);
  bodyBaseline = signal<string>('');
  bodyDirty = computed<boolean>(() => JSON.stringify(this.editing()) !== this.bodyBaseline());
  tabIndex = signal<number>(0);
  readonly blankBodyRow = new PageBodyRow();
  bodyRows = computed<PageBodyRow[]>(() => this.bodies().map(b => Object.assign(new PageBodyRow(), {
    id: b.id, name: b.name, live: b.id === this.value()?.liveBodyId, publishedAt: b.publishedAt ?? '',
    draftDiffers: !!b.publishedAt && JSON.stringify(b.draftSections) !== JSON.stringify(b.publishedSections ?? []), sections: (b.draftSections ?? []).length
  })));
  /** Row click in the Bodies tab: open that body's content. */
  openBodyRow(row: PageBodyRow) { this.selectBody(row.id); this.tabIndex.set(2); }
  bodyOptions = computed<MatOption<string>[]>(() => this.bodies().map(b => ({ value: b.id, valueLabel: `${b.name}${b.id === this.value()?.liveBodyId ? ' ● live' : ''}${b.publishedAt ? '' : ' (never published)'}` })));
  bodyUnpublished = computed<boolean>(() => { const b = this.editing(); return !!b && !!b.publishedAt && JSON.stringify(b.draftSections) !== JSON.stringify(b.publishedSections ?? []); });
  isLive = computed<boolean>(() => !!this.editing() && this.editing()!.id === this.value()?.liveBodyId);

  loadBodies(selectId?: string | null) {
    const id = this.pageId(); if (!id) return;
    this.sf.bodies(id).subscribe({
      next: list => {
        this.bodies.set(list);
        const want = selectId ?? this.selectedId() ?? this.value()?.liveBodyId;
        if (want) { this.selectBody(list.find(b => b.id === want)?.id ?? list[0]?.id ?? null); return; }
        // The page itself may still be loading: ask for its live pointer directly.
        this.sf.pageFull(id).subscribe({ next: p => this.selectBody(list.find(b => b.id === p.liveBodyId)?.id ?? list[0]?.id ?? null), error: () => this.selectBody(list[0]?.id ?? null) });
      },
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }
  selectBody(bodyId: string | null) {
    this.selectedId.set(bodyId);
    const b = this.bodies().find(x => x.id === bodyId) ?? null;
    this.editing.set(b ? JSON.parse(JSON.stringify(b)) : null); this.bodyBaseline.set(JSON.stringify(this.editing()));
  }
  onSections(sections: PageSection[]) { const b = this.editing(); if (b) this.editing.set({ ...b, draftSections: sections }); }
  onBodyName(name: string) { const b = this.editing(); if (b) this.editing.set({ ...b, name }); }
  saveBody() {
    const id = this.id(), b = this.editing(); if (!id || !b || !this.bodyDirty()) return;
    this.sf.updateBody(id, b).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({ next: saved => { this.bodies.set(this.bodies().map(x => x.id === saved.id ? saved : x)); this.selectBody(saved.id); SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, 'Body draft saved', 'Dismiss', 3000); }, error: err => this.dialogUtils.openErrorMessageFromError(err) });
  }
  revertBody() { this.selectBody(this.selectedId()); }
  async newBody(copy: boolean) {
    const id = this.pageId(); if (!id) return;
    const name = await this.dialogUtils.openInputDialog(copy ? 'Copy this body' : 'New body', 'Name', 'Create', 'Cancel', false, copy ? (this.editing()?.name ?? '') + ' (copy)' : '').catch(() => null);
    if (!name) return;
    this.sf.createBody(id, String(name), copy ? this.selectedId() : null).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({ next: b => this.loadBodies(b.id), error: err => this.dialogUtils.openErrorMessageFromError(err) });
  }
  async publishBody() {
    const id = this.pageId(), b = this.editing(); if (!id || !b) return;
    if (this.bodyDirty()) { SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, 'Save the draft first', 'Dismiss', 3000); return; }
    const ok = await this.dialogUtils.openConfirmDialog('Publish body?', this.isLive() ? 'This body is live — customers see the change immediately.' : 'Snapshots the draft; customers see it once this body is made live or a template points at it.', 'Publish', 'Cancel').catch(() => false);
    if (ok) this.sf.publishBody(id, b.id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({ next: () => this.loadBodies(b.id), error: err => this.dialogUtils.openErrorMessageFromError(err) });
  }
  async discardBody() {
    const id = this.pageId(), b = this.editing(); if (!id || !b) return;
    const ok = await this.dialogUtils.openConfirmDialog('Discard draft?', 'Back to this body\'s published copy.', 'Discard', 'Keep').catch(() => false);
    if (ok) this.sf.discardBodyDraft(id, b.id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({ next: () => this.loadBodies(b.id), error: err => this.dialogUtils.openErrorMessageFromError(err) });
  }
  async makeLive() {
    const id = this.pageId(), b = this.editing(); if (!id || !b) return;
    if (this.bodyDirty()) { SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, 'Save the draft first', 'Dismiss', 3000); return; }
    const ok = await this.dialogUtils.openConfirmDialog('Make this body live?', `Customers will see "${b.name}" (published if needed) from now on.`, 'Make live', 'Cancel').catch(() => false);
    if (ok) this.sf.makeLive(id, b.id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({ next: p => { this._value.set(p); this.loadBodies(b.id); }, error: err => this.dialogUtils.openErrorMessageFromError(err) });
  }
  async takeOffline() {
    const id = this.pageId(); if (!id) return;
    const ok = await this.dialogUtils.openConfirmDialog('Take page offline?', 'Customers get nothing for this page until a body is made live again.', 'Take offline', 'Cancel').catch(() => false);
    if (ok) this.sf.takeOffline(id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({ next: p => { this._value.set(p); this.loadBodies(); }, error: err => this.dialogUtils.openErrorMessageFromError(err) });
  }
  async deleteBody() {
    const id = this.pageId(), b = this.editing(); if (!id || !b) return;
    const ok = await this.dialogUtils.openConfirmDialog('Delete body?', `Delete "${b.name}"? Templates pointing at it fall back to the live body.`, 'Delete', 'Cancel').catch(() => false);
    if (ok) this.sf.deleteBody(id, b.id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({ next: () => this.loadBodies(null), error: err => this.dialogUtils.openErrorMessageFromError(err) });
  }
  previewBody() { const b = this.editing(); this.router.navigate([APP_ROUTES.systemStorefrontPreview], { queryParams: { draft: true, slug: this.value()?.slug, bodyId: b?.id } }); }

  override getRouteId() { const id = RouteUtils.getPathVariable('pages'); return id === 'new' ? null : id; }
  /** The page id before the page itself has loaded (id() is derived from the loaded value). */
  private pageId(): string | null { return (this.id() as string | undefined) ?? this.getRouteId() ?? null; }
  override ngOnInit(): void { super.ngOnInit(); if (this.getRouteId()) this.loadBodies(); }
  protected override afterSave(res: StorefrontPage, wasCreate: boolean): void {
    if (wasCreate && res.id) { this.router.navigate([APP_ROUTES.systemStorefrontPage(res.id)], { replaceUrl: true }); this.loadBodies(); }
    SnackBarUtils.openSnackBar(this.rxjsUtils.snackBar, 'Page saved', 'Dismiss', 3000);
  }
  onMainFormChange(v: StorefrontPage) { const cur = this.value(); this.value.set({ ...v, role: cur?.role ?? PageRole.CUSTOM, liveBodyId: cur?.liveBodyId, bodies: cur?.bodies ?? [] }); }

  back() { this.router.navigate([APP_ROUTES.systemStorefrontPages]); }
}
