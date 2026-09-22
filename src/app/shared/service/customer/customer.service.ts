import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesService } from '../../../../lib/service/rest.service';
import { OrderFulfillment } from '../../model/commerce.model';
import { CustomerDetail, CustomerNote, CustomerPage } from '../../model/customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private http = inject(HttpClient);
  private baseUrl = `${ViesService.getUri()}/api/v1/customers`;

  list(search: string, page: number = 0, size: number = 25): Observable<CustomerPage> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (search?.trim()) params = params.set('search', search.trim());
    return this.http.get<CustomerPage>(this.baseUrl, { params });
  }

  get(userId: string): Observable<CustomerDetail> {
    return this.http.get<CustomerDetail>(`${this.baseUrl}/${userId}`);
  }

  orders(userId: string): Observable<OrderFulfillment[]> {
    return this.http.get<OrderFulfillment[]>(`${this.baseUrl}/${userId}/orders`);
  }

  addNote(userId: string, text: string): Observable<CustomerNote> {
    return this.http.post<CustomerNote>(`${this.baseUrl}/${userId}/notes`, { text });
  }

  deleteNote(userId: string, noteId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${userId}/notes/${noteId}`);
  }
}
