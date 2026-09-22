import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesService } from '../../../../lib/service/rest.service';
import { OrderFulfillment, ReturnRequest, StockMovement } from '../../model/commerce.model';
import { Product } from '../../model/product.model';
import { Review } from '../../model/user-info.model';
import { ListPage, ListQuery } from '../../model/list-page.model';

// Server-side lists: filtered, searched, paged and sorted in the database.
// `sort` = "field,asc|desc" (allow-listed server-side); default newest first.
@Injectable({ providedIn: 'root' })
export class SearchService {
  private http = inject(HttpClient);
  private base = `${ViesService.getUri()}/api/v1`;

  orders(query: ListQuery): Observable<ListPage<OrderFulfillment>> {
    return this.http.get<ListPage<OrderFulfillment>>(`${this.base}/orders/search`, { params: this.params(query) });
  }

  products(query: ListQuery): Observable<ListPage<Product>> {
    return this.http.get<ListPage<Product>>(`${this.base}/products/search`, { params: this.params(query) });
  }

  returns(query: ListQuery): Observable<ListPage<ReturnRequest>> {
    return this.http.get<ListPage<ReturnRequest>>(`${this.base}/returns/search`, { params: this.params(query) });
  }

  reviews(query: ListQuery): Observable<ListPage<Review>> {
    return this.http.get<ListPage<Review>>(`${this.base}/reviews/search`, { params: this.params(query) });
  }

  movements(query: ListQuery): Observable<ListPage<StockMovement>> {
    return this.http.get<ListPage<StockMovement>>(`${this.base}/stock/movements/search`, { params: this.params(query) });
  }

  private params(query: ListQuery): HttpParams {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === '') continue;
      p = p.set(k, String(v));
    }
    return p;
  }
}
