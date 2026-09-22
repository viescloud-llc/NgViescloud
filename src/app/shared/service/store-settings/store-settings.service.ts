import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ViesService } from '../../../../lib/service/rest.service';
import { PublicStoreInfo, StoreSettings } from '../../model/store-settings.model';

// /api/v1/store-settings (settings:read / settings:update) + the public store
// info. `current` caches the last loaded settings for receipts / defaults.
@Injectable({ providedIn: 'root' })
export class StoreSettingsService {
  private http = inject(HttpClient);
  private base = `${ViesService.getUri()}/api/v1`;

  readonly current = signal<StoreSettings | null>(null);
  readonly publicInfo = signal<PublicStoreInfo | null>(null);

  get(): Observable<StoreSettings> {
    return this.http.get<StoreSettings>(`${this.base}/store-settings`).pipe(tap(s => this.current.set(s)));
  }
  update(s: StoreSettings): Observable<StoreSettings> {
    return this.http.put<StoreSettings>(`${this.base}/store-settings`, s).pipe(tap(x => this.current.set(x)));
  }
  uploadLogo(file: File): Observable<StoreSettings> {
    const form = new FormData(); form.append('file', file, file.name);
    return this.http.post<StoreSettings>(`${this.base}/store-settings/logo`, form).pipe(tap(x => this.current.set(x)));
  }
  deleteLogo(): Observable<StoreSettings> {
    return this.http.delete<StoreSettings>(`${this.base}/store-settings/logo`).pipe(tap(x => this.current.set(x)));
  }
  /** Staff logo bytes (settings:read). */
  logoBlob(): Observable<Blob> { return this.http.get(`${this.base}/store-settings/logo`, { responseType: 'blob' }); }

  loadPublic(): Observable<PublicStoreInfo> {
    return this.http.get<PublicStoreInfo>(`${this.base}/public/store`).pipe(tap(i => this.publicInfo.set(i)));
  }
  publicLogoUrl(): string { return `${this.base}/public/store/logo`; }
}
