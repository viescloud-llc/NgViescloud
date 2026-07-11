import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesService } from '../../../../lib/service/rest.service';
import { PageResponse } from '../../../../lib/model/vies.model';
import { Product } from '../../model/product.model';
import { Review } from '../../model/user-info.model';
import {
  CategoryFilterDimensions,
  ProductFilterMap,
  ProductSearchRequest
} from '../../model/public-product.model';

// Storefront read API. NO auth required — backed by `/api/v1/public/*` endpoints.
// Only returns products with `status: ACTIVE`. Spec § 8.4.
//
// Lives in the Manager app even though it powers the storefront, because both
// frontends share this src/lib + src/app/shared layer.
@Injectable({
  providedIn: 'root'
})
export class PublicProductsService {
  private http = inject(HttpClient);
  private baseUrl = `${ViesService.getUri()}/api/v1/public/products`;

  // Preferred path — POST body avoids URL-length limits and types repeating fields cleanly.
  search(request: ProductSearchRequest): Observable<PageResponse<Product>> {
    return this.http.post<PageResponse<Product>>(`${this.baseUrl}/search`, request);
  }

  // Equivalent GET shape for bookmarkability / quick curl. Same service method
  // server-side; subject to ~2-8KB URL-length limits at proxies.
  searchViaGet(request: ProductSearchRequest): Observable<PageResponse<Product>> {
    let params = new HttpParams();

    if (request.categoryId) params = params.set('categoryId', request.categoryId);
    if (request.tagIds) request.tagIds.forEach(id => { params = params.append('tagIds', id); });
    if (request.q) params = params.set('q', request.q);
    if (request.currency) params = params.set('currency', request.currency);
    if (request.minPrice !== undefined) params = params.set('minPrice', request.minPrice);
    if (request.maxPrice !== undefined) params = params.set('maxPrice', request.maxPrice);
    if (request.attributes) {
      for (const [name, values] of Object.entries(request.attributes)) {
        values.forEach(v => { params = params.append(`attribute.${name}`, v); });
      }
    }
    if (request.page !== undefined) params = params.set('page', String(request.page));
    if (request.size !== undefined) params = params.set('size', String(request.size));
    if (request.sort) params = params.set('sort', request.sort);
    if (request.sortDir) params = params.set('sortDir', request.sortDir);

    return this.http.get<PageResponse<Product>>(this.baseUrl, { params });
  }

  getById(id: string): Observable<Product> {
    // 404 for unknown id OR status !== ACTIVE.
    return this.http.get<Product>(`${this.baseUrl}/${id}`);
  }

  // Lightweight per-category filter dimensions; per request, not cached.
  // Useful when the storefront has narrowed to one category and wants only
  // the attributes registered against it.
  getCategoryFilters(categoryId?: string): Observable<CategoryFilterDimensions> {
    let params = new HttpParams();
    if (categoryId) params = params.set('categoryId', categoryId);
    return this.http.get<CategoryFilterDimensions>(`${this.baseUrl}/filters`, { params });
  }

  // Cached (60s refresh server-side) self-describing filter catalog. Primary
  // way to power dynamic filter UI — iterate `filters[]`, render a control per
  // entry based on `kind`.
  getFilterMap(): Observable<ProductFilterMap> {
    return this.http.get<ProductFilterMap>(`${this.baseUrl}/filter-map`);
  }

  getReviews(productId: string, params?: { page?: number; size?: number; sort?: string; sortDir?: 'ASC' | 'DESC' }): Observable<PageResponse<Review>> {
    let httpParams = new HttpParams();
    if (params?.page !== undefined) httpParams = httpParams.set('page', String(params.page));
    if (params?.size !== undefined) httpParams = httpParams.set('size', String(params.size));
    if (params?.sort) httpParams = httpParams.set('sort', params.sort);
    if (params?.sortDir) httpParams = httpParams.set('sortDir', params.sortDir);
    return this.http.get<PageResponse<Review>>(`${this.baseUrl}/${productId}/reviews`, { params: httpParams });
  }
}
