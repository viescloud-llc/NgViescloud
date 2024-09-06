import { Injectable } from '@angular/core';
import { ViesRestService } from './Rest.service';
import { AiReaderGenerateWavRequest } from '../model/AI.model';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, first } from 'rxjs';
import { AuthenticatorService } from './Authenticator.service';

@Injectable({
  providedIn: 'root'
})
export class AIReaderService extends ViesRestService<AiReaderGenerateWavRequest> {

  protected override getPrefixes(): string[] {
    return ['ai', 'reader'];
  }

  constructor(httpClient: HttpClient, private authenticatorService: AuthenticatorService) {
    super(httpClient);
  }

  public postSpeakWav(text: string) {
    let p: AiReaderGenerateWavRequest = {text : text};
    return this.httpClient.post(`${this.getURI()}${this.getPrefixPath()}/generate/wav`, p, {observe: 'response', responseType: 'blob'}).pipe(first());
  }

  public getSpeakWav(text: string): Observable<any> {
    return this.httpClient.get<any>(`${this.getURI()}${this.getPrefixPath()}/generate/wav?text=${text}`).pipe(first());
  }

  public generateSpeakWavLink(text: string): string {
    return `${this.getURI()}${this.getPrefixPath()}/generate/wav?text=${text}&authorization=${this.authenticatorService.getJwt()}`;
  }
}
