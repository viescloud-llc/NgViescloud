import { HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EnsibleAuthenticatorService } from '../service/ensible-authenticator/ensible-authenticator.service';
import { ensibleEnvironment } from 'projects/environments/ensible-environment.prod';
import { EnsibleService } from '../service/ensible/ensible.service';

const headers = new HttpHeaders().set('content-type', 'application/json');

@Injectable({
  providedIn: 'root'
})
export class EnsibleAuthInterceptor implements HttpInterceptor
{
  constructor(private ensibleAuthenticator: EnsibleAuthenticatorService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>
  {
    if(!req.url.includes(EnsibleService.getUri()))
      return next.handle(req);

    let body = req.body;
    let jwt = this.ensibleAuthenticator.getToken();

    if(body && typeof body === 'string')
      return next.handle(req.clone({
        headers: req.headers.set('Content-Type', 'application/json')
                            .set('Authorization', `Bearer ${jwt}`),
      }));

    return next.handle(req.clone({
      headers: req.headers.set('Authorization', `Bearer ${jwt}`),
    }));
  }


}
