import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';
import { MaintenanceService } from '../service/maintenance.service';

/**
 * Recognises the backend's maintenance rejection — HTTP 503 whose JSON body
 * carries `maintenance: true` — records the status on `MaintenanceService`
 * and sends the user to the maintenance page. Staff with `maintenance:bypass`
 * never receive that 503, so the Manager keeps working for them.
 *
 * Register in the app: `{ provide: HTTP_INTERCEPTORS, useClass: MaintenanceInterceptor, multi: true }`
 * and route `maintenanceRoute` (default '/maintenance') to `MaintenancePageComponent`.
 */
@Injectable({ providedIn: 'root' })
export class MaintenanceInterceptor implements HttpInterceptor {

  static maintenanceRoute = '/maintenance';
  /** Routes that must stay reachable during maintenance so staff can sign in and switch it off (FE-26). */
  static passThroughRoutes: string[] = ['/login', '/oauth2', '/home', '/system/maintenance', '/setting'];

  static isPassThrough(url: string): boolean {
    const path = (url || '').split('?')[0];
    return path === '/' || MaintenanceInterceptor.passThroughRoutes.some(r => path === r || path.startsWith(r + '/') || path.startsWith(r));
  }

  constructor(private injector: Injector) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 503 && err.error?.maintenance === true) {
          const maintenance = this.injector.get(MaintenanceService);
          const router = this.injector.get(Router);
          maintenance.applyRejectedStatus(err.error);
          // Only customer-facing pages bounce to the maintenance page. The login page's own
          // background calls (store info, providers, dashboard) 503 too — redirecting from there
          // would lock every signed-out admin out until the API is poked by hand (FE-26).
          if (!router.url.startsWith(MaintenanceInterceptor.maintenanceRoute) && !MaintenanceInterceptor.isPassThrough(router.url)) {
            router.navigate([MaintenanceInterceptor.maintenanceRoute]);
          }
        }
        return throwError(() => err);
      })
    );
  }
}
