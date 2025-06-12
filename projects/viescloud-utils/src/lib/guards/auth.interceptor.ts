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
export class AuthInterceptor implements HttpInterceptor
{
  constructor(private authenticatorService: AuthenticatorService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> 
  {
    if(!req.url.includes(environment.gateway_api))
      return next.handle(req);

    let body = req.body;
    let token = this.authenticatorService.currentJwtToken;
    let change = false;
    let httpHeader = req.headers;

    if(token && !req.headers.has('Authorization')) {
      httpHeader.set('Authorization', `Bearer ${token}`);
      change = true;
    }

    if(body && typeof body === 'string' && StringUtils.isValidJson(body)) {
      httpHeader.set('Content-Type', 'application/json');
      change = true;
    }

    if(change) {
      return next.handle(req.clone({
        headers: httpHeader
      }));
    }
    else {
      return next.handle(req);
    }


    // if(body && typeof body === 'string')
    //   return next.handle(req.clone({
    //     headers: req.headers.set('Content-Type', 'application/json')
    //                         .set('Authorization', `Bearer ${token}`),
    //   }));

    // return next.handle(req.clone({
    //   headers: req.headers.set('Authorization', `Bearer ${jwt}`),
    // }));

    // if (token && !req.headers.has('Authorization')) {
    //   const authReq = req.clone({
    //     headers: req.headers.set('Authorization', `Bearer ${token}`)
    //   });
    //   return next.handle(authReq);
    // }
    
    // return next.handle(req);
  }
}
