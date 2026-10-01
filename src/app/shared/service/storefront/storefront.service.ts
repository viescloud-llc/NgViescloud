import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ViesRestService, ViesService } from '../../../../lib/service/rest.service';
import { Product } from '../../model/product.model';
import { appearanceFromWire, appearanceToWire, AssetOwnerType, behaviourFromWire, behaviourToWire, bodyFromWire, PageBody, PageRole, PageSection, PageView, ProductSelector, ResolvedStorefront, StorefrontAppearance, StorefrontAsset, StorefrontBehaviour, StorefrontPage, StorefrontSchedule, StorefrontTemplate } from '../../model/storefront.model';

// ---- Default look + behaviour, assets, previews (/api/v1/storefront/**, authority `storefront`) ----
export interface StorefrontSettingsDoc { appearance: StorefrontAppearance; behaviour: StorefrontBehaviour; }

@Injectable({ providedIn: 'root' })
export class StorefrontService {
  private http = inject(HttpClient);
  private base = `${ViesService.getUri()}/api/v1`;

  getSettings(): Observable<StorefrontSettingsDoc> {
    return this.http.get<{ appearance: unknown; behaviour: unknown }>(`${this.base}/storefront/settings`)
      .pipe(map(d => ({ appearance: appearanceFromWire(d.appearance as never), behaviour: behaviourFromWire(d.behaviour as never) })));
  }
  updateSettings(doc: StorefrontSettingsDoc): Observable<StorefrontSettingsDoc> {
    return this.http.put<{ appearance: unknown; behaviour: unknown }>(`${this.base}/storefront/settings`, { appearance: appearanceToWire(doc.appearance), behaviour: behaviourToWire(doc.behaviour) })
      .pipe(map(d => ({ appearance: appearanceFromWire(d.appearance as never), behaviour: behaviourFromWire(d.behaviour as never) })));
  }

  live(): Observable<ResolvedStorefront> { return this.http.get<ResolvedStorefront>(`${this.base}/public/storefront`); }
  preview(templateId?: string | null, draft = false): Observable<ResolvedStorefront> {
    let p = new HttpParams().set('draft', draft); if (templateId) p = p.set('templateId', templateId);
    return this.http.get<ResolvedStorefront>(`${this.base}/storefront/preview`, { params: p });
  }
  resolveSelector(sel: ProductSelector): Observable<Product[]> { return this.http.post<Product[]>(`${this.base}/storefront/selector/resolve`, sel); }
  publicPage(slug: string): Observable<PageView> { return this.http.get<PageView>(`${this.base}/public/storefront/pages/${slug}`); }
  previewPage(slug: string, templateId?: string | null, draft = true, bodyId?: string | null): Observable<PageView> {
    let p = new HttpParams().set('draft', draft); if (templateId) p = p.set('templateId', templateId); if (bodyId) p = p.set('bodyId', bodyId);
    return this.http.get<PageView>(`${this.base}/storefront/preview/pages/${slug}`, { params: p });
  }

  assets(ownerType: AssetOwnerType, ownerId?: string | null): Observable<StorefrontAsset[]> {
    let p = new HttpParams().set('ownerType', ownerType); if (ownerId) p = p.set('ownerId', ownerId);
    return this.http.get<StorefrontAsset[]>(`${this.base}/storefront/assets`, { params: p });
  }
  uploadAsset(ownerType: AssetOwnerType, ownerId: string | null | undefined, file: File, label?: string): Observable<StorefrontAsset> {
    const form = new FormData(); form.append('file', file, file.name);
    let p = new HttpParams().set('ownerType', ownerType); if (ownerId) p = p.set('ownerId', ownerId); if (label) p = p.set('label', label);
    return this.http.post<StorefrontAsset>(`${this.base}/storefront/assets`, form, { params: p });
  }
  deleteAsset(id: string): Observable<void> { return this.http.delete<void>(`${this.base}/storefront/assets/${id}`); }
  assetUrl(id?: string | null): string { return id ? `${this.base}/public/storefront/assets/${id}` : ''; }

  // template actions (the CRUD lives in StorefrontTemplateService)
  publishTemplate(id: string): Observable<StorefrontTemplate> { return this.http.post<StorefrontTemplate>(`${this.base}/storefront/templates/${id}/publish`, null).pipe(map(StorefrontTemplateService.fromWire)); }
  discardTemplateDraft(id: string): Observable<StorefrontTemplate> { return this.http.post<StorefrontTemplate>(`${this.base}/storefront/templates/${id}/discard-draft`, null).pipe(map(StorefrontTemplateService.fromWire)); }
  duplicateTemplate(id: string, name?: string): Observable<StorefrontTemplate> { return this.http.post<StorefrontTemplate>(`${this.base}/storefront/templates/${id}/duplicate`, { name }).pipe(map(StorefrontTemplateService.fromWire)); }
  templateFromLive(name?: string): Observable<StorefrontTemplate> { return this.http.post<StorefrontTemplate>(`${this.base}/storefront/templates/from-live`, { name }).pipe(map(StorefrontTemplateService.fromWire)); }
  activateNow(id: string): Observable<StorefrontSchedule> { return this.http.post<StorefrontSchedule>(`${this.base}/storefront/templates/${id}/activate-now`, null); }
  deactivate(id: string): Observable<{ ended: number }> { return this.http.post<{ ended: number }>(`${this.base}/storefront/templates/${id}/deactivate`, null); }
  // pages: bodies (named versions of the content) + the live pointer
  homePage(): Observable<StorefrontPage> { return this.http.get<StorefrontPage>(`${this.base}/storefront/pages/home`).pipe(map(StorefrontPageService.fix)); }
  allPages(): Observable<StorefrontPage[]> { return this.http.get<StorefrontPage[]>(`${this.base}/storefront/pages/all`).pipe(map(l => l.map(StorefrontPageService.fix))); }
  pageFull(id: string): Observable<StorefrontPage> { return this.http.get<StorefrontPage>(`${this.base}/storefront/pages/${id}/full`).pipe(map(StorefrontPageService.fix)); }
  pageByRole(role: PageRole): Observable<StorefrontPage> { return this.http.get<StorefrontPage>(`${this.base}/storefront/pages/by-role/${role}`).pipe(map(StorefrontPageService.fix)); }
  bodies(pageId: string): Observable<PageBody[]> { return this.http.get<PageBody[]>(`${this.base}/storefront/pages/${pageId}/bodies`).pipe(map(l => l.map(bodyFromWire))); }
  createBody(pageId: string, name: string, copyOf?: string | null, sections?: PageSection[]): Observable<PageBody> {
    return this.http.post<PageBody>(`${this.base}/storefront/pages/${pageId}/bodies`, { name, copyOf: copyOf || undefined, sections }).pipe(map(bodyFromWire));
  }
  updateBody(pageId: string, body: PageBody): Observable<PageBody> { return this.http.put<PageBody>(`${this.base}/storefront/pages/${pageId}/bodies/${body.id}`, { name: body.name, draftSections: body.draftSections }).pipe(map(bodyFromWire)); }
  publishBody(pageId: string, bodyId: string): Observable<PageBody> { return this.http.post<PageBody>(`${this.base}/storefront/pages/${pageId}/bodies/${bodyId}/publish`, null).pipe(map(bodyFromWire)); }
  discardBodyDraft(pageId: string, bodyId: string): Observable<PageBody> { return this.http.post<PageBody>(`${this.base}/storefront/pages/${pageId}/bodies/${bodyId}/discard-draft`, null).pipe(map(bodyFromWire)); }
  makeLive(pageId: string, bodyId: string): Observable<StorefrontPage> { return this.http.post<StorefrontPage>(`${this.base}/storefront/pages/${pageId}/bodies/${bodyId}/make-live`, null).pipe(map(StorefrontPageService.fix)); }
  takeOffline(pageId: string): Observable<StorefrontPage> { return this.http.post<StorefrontPage>(`${this.base}/storefront/pages/${pageId}/take-offline`, null).pipe(map(StorefrontPageService.fix)); }
  deleteBody(pageId: string, bodyId: string): Observable<void> { return this.http.delete<void>(`${this.base}/storefront/pages/${pageId}/bodies/${bodyId}`); }
}

// ---- 7-verb CRUD resources on the lib REST base ------------------------------------------
// Pages: bodies' sections are decorated per type on the way in so the dynamic form can render them.
@Injectable({ providedIn: 'root' })
export class StorefrontPageService extends ViesRestService<StorefrontPage> {
  protected override getPrefixes(): string[] { return ['api', 'v1', 'storefront', 'pages']; }
  override newBlankObject(): StorefrontPage { return new StorefrontPage(); }
  override getIdFieldValue(o: StorefrontPage) { return o.id; }
  override setIdFieldValue(o: StorefrontPage, id: any): void { o.id = id; }
  static fix(p: StorefrontPage): StorefrontPage {
    const out = Object.assign(new StorefrontPage(), p);
    out.bodies = (p.bodies ?? []).map(bodyFromWire);
    return out;
  }
  override get(id: any): Observable<StorefrontPage> { return super.get(id).pipe(map(StorefrontPageService.fix)); }
  override getAll(): Observable<StorefrontPage[]> { return super.getAll().pipe(map(l => l.map(StorefrontPageService.fix))); }
  override post(o: StorefrontPage): Observable<StorefrontPage> { return super.post(o).pipe(map(StorefrontPageService.fix)); }
  override put(id: any, o: StorefrontPage): Observable<StorefrontPage> { return super.put(id, o).pipe(map(StorefrontPageService.fix)); }
}

// Templates: appearance is hex/ISO on the wire, RgbColor/ViesDateTime on the client.
@Injectable({ providedIn: 'root' })
export class StorefrontTemplateService extends ViesRestService<StorefrontTemplate> {
  protected override getPrefixes(): string[] { return ['api', 'v1', 'storefront', 'templates']; }
  override newBlankObject(): StorefrontTemplate { return new StorefrontTemplate(); }
  override getIdFieldValue(o: StorefrontTemplate) { return o.id; }
  override setIdFieldValue(o: StorefrontTemplate, id: any): void { o.id = id; }
  static fromWire(t: StorefrontTemplate): StorefrontTemplate {
    const out = Object.assign(new StorefrontTemplate(), t);
    out.description = t.description ?? '';
    out.draftAppearance = appearanceFromWire(t.draftAppearance as never);
    out.publishedAppearance = t.publishedAppearance ? appearanceFromWire(t.publishedAppearance as never) : null;
    out.affectedRoles = t.affectedRoles ?? [PageRole.HOME, PageRole.CUSTOM];
    out.pageBodies = t.pageBodies ?? {};
    return out;
  }
  static toWire(t: StorefrontTemplate): StorefrontTemplate {
    return { ...t, draftAppearance: appearanceToWire(t.draftAppearance), publishedAppearance: undefined } as unknown as StorefrontTemplate;
  }
  override get(id: any): Observable<StorefrontTemplate> { return super.get(id).pipe(map(StorefrontTemplateService.fromWire)); }
  override getAll(): Observable<StorefrontTemplate[]> { return super.getAll().pipe(map(l => l.map(StorefrontTemplateService.fromWire))); }
  override post(o: StorefrontTemplate): Observable<StorefrontTemplate> { return super.post(StorefrontTemplateService.toWire(o)).pipe(map(StorefrontTemplateService.fromWire)); }
  override put(id: any, o: StorefrontTemplate): Observable<StorefrontTemplate> { return super.put(id, StorefrontTemplateService.toWire(o)).pipe(map(StorefrontTemplateService.fromWire)); }
}

@Injectable({ providedIn: 'root' })
export class StorefrontScheduleService extends ViesRestService<StorefrontSchedule> {
  protected override getPrefixes(): string[] { return ['api', 'v1', 'storefront', 'schedules']; }
  override newBlankObject(): StorefrontSchedule { return new StorefrontSchedule(); }
  override getIdFieldValue(o: StorefrontSchedule) { return o.id; }
  override setIdFieldValue(o: StorefrontSchedule, id: any): void { o.id = id; }
}
