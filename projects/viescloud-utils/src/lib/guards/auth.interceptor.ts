import { HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthenticatorService } from '../service/authenticator.service';
import { environment } from 'projects/environments/environment.prod';
import { StringUtils } from '../util/String.utils';
import { ViesService } from '../service/rest.service';

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private injector: Injector
  ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const authenticatorService = this.injector.get(AuthenticatorService);

    if (!req.url.includes(ViesService.getUri())) {
      return next.handle(req);
    }

    let body = req.body;
    
    if (authenticatorService.isAuthenticatedSync()) {
      let token = authenticatorService.currentJwtToken;
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
