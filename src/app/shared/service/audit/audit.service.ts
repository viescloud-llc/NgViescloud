import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesService } from '../../../../lib/service/rest.service';
import { ChangeLog } from '../../model/audit.model';
import { ListPage, ListQuery } from '../../model/list-page.model';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private http = inject(HttpClient);
  private baseUrl = `${ViesService.getUri()}/api/v1/audit`;

  search(query: ListQuery & { entityType?: string; entityId?: string; actorUserId?: string; action?: string }): Observable<ListPage<ChangeLog>> {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === '') continue;
      p = p.set(k, String(v));
    }
    return this.http.get<ListPage<ChangeLog>>(this.baseUrl, { params: p });
  }

  forEntity(entityType: string, entityId: string, page = 0, size = 25): Observable<ListPage<ChangeLog>> {
    return this.search({ entityType, entityId, page, size });
  }

  entityTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/entity-types`);
  }
}
