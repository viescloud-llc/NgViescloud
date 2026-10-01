import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesService } from '../../../../lib/service/rest.service';
import { PageView, ResolvedStorefront } from '../../model/storefront.model';

// What a customer reads: the live storefront (default look ⊕ active template,
// pages by role) and a published content page by slug — all under
// /api/v1/public/storefront, no session needed. Editing lives in the manager.
@Injectable({ providedIn: 'root' })
export class StorefrontService {
  private http = inject(HttpClient);
  private base = `${ViesService.getUri()}/api/v1`;

  live(): Observable<ResolvedStorefront> { return this.http.get<ResolvedStorefront>(`${this.base}/public/storefront`); }
  publicPage(slug: string): Observable<PageView> { return this.http.get<PageView>(`${this.base}/public/storefront/pages/${slug}`); }
  assetUrl(id?: string | null): string { return id ? `${this.base}/public/storefront/assets/${id}` : ''; }
}
