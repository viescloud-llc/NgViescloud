import { HttpEvent, HttpHandler, HttpHeaders, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable, switchMap, filter, take, of } from 'rxjs';
import { AuthenticatorService } from '../service/authenticator.service';
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

    // Exception: Skip initialization check for the refresh endpoint (used in initializer itself)
    const isRefreshEndpoint = req.url.includes('/api/v1/authenticators/jwt/refresh');

    // Wait for authenticator initialization before processing request (unless it's the refresh endpoint)
    const waitForInit$ = isRefreshEndpoint
      ? of(true)
      : authenticatorService.initialized$.pipe(
          filter(initialized => initialized === true),
          take(1)
        );

    return waitForInit$.pipe(
      switchMap(() => this.handleRequest(req, next, authenticatorService))
    );
  }

  private handleRequest(
    req: HttpRequest<any>,
    next: HttpHandler,
    authenticatorService: AuthenticatorService
  ): Observable<HttpEvent<any>> {
    let body = req.body;
    let token = authenticatorService.currentJwtToken;
    if (token) {
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
