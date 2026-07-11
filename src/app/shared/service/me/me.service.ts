import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesService } from '../../../../lib/service/rest.service';
import { AuthenticatorService } from '../../../../lib/service/authenticator.service';
import { PageResponse } from '../../../../lib/model/vies.model';
import { Review } from '../../model/user-info.model';
import { UserInfo, UserAddress } from '../../model/user-info.model';

// Per-user self-service endpoints that bypass the admin gate by reading the buyer's
// UUID from the `user_id` header (server forces ownership). Spec § 8.5.
//
// `user_id` is required on EVERY endpoint here. Missing → 401, not a UUID → 400,
// mismatched ownership → 403. This service auto-attaches the current user's id from
// AuthenticatorService — call `withUserId(id, fn)` for the unusual override case.
//
// Endpoint groups:
//   /api/v1/me/reviews              — full CRUD on the current user's reviews
//   /api/v1/me/info                 — GET / PUT-upsert / PATCH-merge of UserInfo
//   /api/v1/me/addresses            — GET / PUT-replace of UserAddress (whole set)
@Injectable({
  providedIn: 'root'
})
export class MeService {
  private http = inject(HttpClient);
  private auth = inject(AuthenticatorService);
  private baseUrl = `${ViesService.getUri()}/api/v1/me`;

  // ---- reviews ----------------------------------------------------------

  listMyReviews(params?: { page?: number; size?: number; sort?: string; sortDir?: 'ASC' | 'DESC' }): Observable<PageResponse<Review>> {
    const query = this.buildPageQuery(params);
    return this.http.get<PageResponse<Review>>(`${this.baseUrl}/reviews${query}`, { headers: this.userHeaders() });
  }

  createMyReview(review: Review): Observable<Review> {
    // Server stamps userId from header — body's userId is ignored.
    return this.http.post<Review>(`${this.baseUrl}/reviews`, review, { headers: this.userHeaders() });
  }

  updateMyReview(id: string, review: Review): Observable<Review> {
    // Only `comment` and `rating` are merged server-side; 403 if not mine.
    return this.http.put<Review>(`${this.baseUrl}/reviews/${id}`, review, { headers: this.userHeaders() });
  }

  deleteMyReview(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/reviews/${id}`, { headers: this.userHeaders() });
  }

  // ---- info -------------------------------------------------------------

  getMyInfo(): Observable<UserInfo> {
    // 404 if the row hasn't been created yet — the caller can call upsertMyInfo to create.
    return this.http.get<UserInfo>(`${this.baseUrl}/info`, { headers: this.userHeaders() });
  }

  upsertMyInfo(info: UserInfo): Observable<UserInfo> {
    // PUT — creates if missing, replaces all fields otherwise. userId server-stamped.
    return this.http.put<UserInfo>(`${this.baseUrl}/info`, info, { headers: this.userHeaders() });
  }

  patchMyInfo(partial: Partial<UserInfo>): Observable<UserInfo> {
    // Only fields present in the body are merged. Creates an empty row if none exists.
    return this.http.patch<UserInfo>(`${this.baseUrl}/info`, partial, { headers: this.userHeaders() });
  }

  // ---- addresses --------------------------------------------------------

  getMyAddresses(): Observable<UserAddress> {
    // Returns an empty (unsaved) row when none exists — frontend can render
    // "add your first address" without a separate POST.
    return this.http.get<UserAddress>(`${this.baseUrl}/addresses`, { headers: this.userHeaders() });
  }

  upsertMyAddresses(addresses: UserAddress): Observable<UserAddress> {
    // PUT replaces the full address set. To add/remove one, mutate the array
    // client-side then PUT the whole row.
    return this.http.put<UserAddress>(`${this.baseUrl}/addresses`, addresses, { headers: this.userHeaders() });
  }

  // ---- helpers ----------------------------------------------------------

  private userHeaders(): HttpHeaders {
    const userId = this.auth.currentUser?.id ?? '';
    return new HttpHeaders({ user_id: userId });
  }

  private buildPageQuery(params?: { page?: number; size?: number; sort?: string; sortDir?: 'ASC' | 'DESC' }): string {
    if (!params) return '';
    const usp = new URLSearchParams();
    if (params.page !== undefined) usp.set('page', String(params.page));
    if (params.size !== undefined) usp.set('size', String(params.size));
    if (params.sort) usp.set('sort', params.sort);
    if (params.sortDir) usp.set('sortDir', params.sortDir);
    const s = usp.toString();
    return s ? `?${s}` : '';
  }
}
