import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ViesRestService, ViesService } from './rest.service';
import { Email, EmailMessage, SmtpProvider, SmtpSendResult } from '../model/smtp.model';

/**
 * CRUD over outbound-mail accounts (/api/v1/smtp/providers — authority
 * resource `smtp`, vies-spring-utils 6.5.2). Seven-verb contract; the server
 * owns nothing here beyond the id, so a full PUT of the edited row is the
 * normal save.
 */
@Injectable({ providedIn: 'root' })
export class SmtpProviderService extends ViesRestService<SmtpProvider> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'smtp', 'providers'];
  }

  override newBlankObject(): SmtpProvider {
    return new SmtpProvider();
  }
  override getIdFieldValue(object: SmtpProvider) {
    return object.id;
  }
  override setIdFieldValue(object: SmtpProvider, id: any): void {
    object.id = id;
  }
}

/**
 * Sends mail through a provider (`smtp:send`). `sendWith` takes the provider
 * inline so the editor can test unsaved settings; `sendVia` uses a saved id.
 * Synchronous by default so an SMTP failure comes back as the HTTP error —
 * `async: true` queues server-side and always answers "sended".
 */
@Injectable({ providedIn: 'root' })
export class SmtpSenderService {
  private http = inject(HttpClient);
  private baseUrl = `${ViesService.getUri()}/api/v1/smtp/senders`;

  sendWith(provider: SmtpProvider, message: EmailMessage, opts: { async?: boolean; html?: boolean } = {}): Observable<SmtpSendResult> {
    const body: Email = { smtpProvider: provider, emailMessage: message };
    return this.http.post<SmtpSendResult>(this.baseUrl, body, { params: this.params(opts) });
  }

  sendVia(providerId: string, message: EmailMessage, opts: { async?: boolean; html?: boolean } = {}): Observable<SmtpSendResult> {
    return this.http.post<SmtpSendResult>(`${this.baseUrl}/${providerId}`, message, { params: this.params(opts) });
  }

  private params(opts: { async?: boolean; html?: boolean }): HttpParams {
    return new HttpParams().set('async', String(!!opts.async)).set('html', String(!!opts.html));
  }
}
