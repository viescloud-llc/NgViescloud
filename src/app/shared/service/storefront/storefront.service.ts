import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ViesRestService, ViesService } from '../../../../lib/service/rest.service';
import { Product } from '../../model/product.model';
import { appearanceFromWire, appearanceToWire, AssetOwnerType, behaviourFromWire, behaviourToWire, ProductSelector, ResolvedStorefront, sectionsFromWire, StorefrontAppearance, StorefrontAsset, StorefrontBehaviour, StorefrontPage, StorefrontSchedule, StorefrontTemplate } from '../../model/storefront.model';

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
  // page actions
  homePage(): Observable<StorefrontPage> { return this.http.get<StorefrontPage>(`${this.base}/storefront/pages/home`).pipe(map(StorefrontPageService.fix)); }
  publishPage(id: string): Observable<StorefrontPage> { return this.http.post<StorefrontPage>(`${this.base}/storefront/pages/${id}/publish`, null).pipe(map(StorefrontPageService.fix)); }
  discardPageDraft(id: string): Observable<StorefrontPage> { return this.http.post<StorefrontPage>(`${this.base}/storefront/pages/${id}/discard-draft`, null).pipe(map(StorefrontPageService.fix)); }
}

// ---- 7-verb CRUD resources on the lib REST base ------------------------------------------
// Pages: draft sections are decorated per type on the way in so the dynamic form can render them.
@Injectable({ providedIn: 'root' })
export class StorefrontPageService extends ViesRestService<StorefrontPage> {
  protected override getPrefixes(): string[] { return ['api', 'v1', 'storefront', 'pages']; }
  override newBlankObject(): StorefrontPage { return new StorefrontPage(); }
  override getIdFieldValue(o: StorefrontPage) { return o.id; }
  override setIdFieldValue(o: StorefrontPage, id: any): void { o.id = id; }
  static fix(p: StorefrontPage): StorefrontPage {
    const out = Object.assign(new StorefrontPage(), p);
    out.draftSections = sectionsFromWire(p.draftSections); out.publishedSections = sectionsFromWire(p.publishedSections);
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
    out.draftHomeSections = sectionsFromWire(t.draftHomeSections); out.publishedHomeSections = t.publishedHomeSections ? sectionsFromWire(t.publishedHomeSections) : null;
    return out;
  }
  static toWire(t: StorefrontTemplate): StorefrontTemplate {
    return { ...t, draftAppearance: appearanceToWire(t.draftAppearance), publishedAppearance: undefined, publishedHomeSections: undefined } as unknown as StorefrontTemplate;
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
