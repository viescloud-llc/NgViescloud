import { HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthenticatorService } from '../service/authenticator.service';
import { environment } from 'projects/environments/environment.prod';
import { StringUtils } from '../util/String.utils';

const headers = new HttpHeaders().set('content-type', 'application/json');

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authenticatorService: AuthenticatorService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!req.url.includes(environment.gateway_api))
      return next.handle(req);

    let body = req.body;
    
    if (this.authenticatorService.isAuthenticatedSync()) {
      let token = this.authenticatorService.currentJwtToken;
      if (body && typeof body === 'string' && StringUtils.isValidJson(body)) {
        return next.handle(req.clone({
          headers: req.headers.set('Content-Type', 'application/json')
                              .set('Authorization', `Bearer ${token}`),
        }));
      }
      else {
        return next.handle(req.clone({
          headers: req.headers.set('Authorization', `Bearer ${token}`),
        }));
      }
    }
    else {
      if (body && typeof body === 'string' && StringUtils.isValidJson(body)) {
        return next.handle(req.clone({
          headers: req.headers.set('Content-Type', 'application/json')
        }));
      }
      else {
        return next.handle(req);
      }
    }
  }
}
