import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesService } from '../../../../lib/service/rest.service';
import { MailEvent, MailEventSetting } from '../../model/mail.model';

@Injectable({ providedIn: 'root' })
export class MailSettingsService {
  private http = inject(HttpClient);
  private baseUrl = `${ViesService.getUri()}/api/v1/mail`;

  list(): Observable<MailEventSetting[]> {
    return this.http.get<MailEventSetting[]>(`${this.baseUrl}/settings`);
  }

  update(event: MailEvent, patch: { enabled?: boolean; subjectOverride?: string; recipients?: string }): Observable<MailEventSetting> {
    return this.http.put<MailEventSetting>(`${this.baseUrl}/settings/${event}`, patch);
  }

  /** Rendered sample HTML (subject line included at the top). */
  preview(event: MailEvent): Observable<string> {
    return this.http.get(`${this.baseUrl}/preview/${event}`, { responseType: 'text' });
  }

  sendTest(event: MailEvent, to: string): Observable<{ status: string; to: string; subject: string }> {
    const params = new HttpParams().set('to', to);
    return this.http.post<{ status: string; to: string; subject: string }>(`${this.baseUrl}/test/${event}`, null, { params });
  }
}
