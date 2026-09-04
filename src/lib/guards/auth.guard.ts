import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, CanDeactivate, CanLoad, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable, catchError, delay, filter, first, firstValueFrom, map, of, race, switchMap, take, tap, timer } from 'rxjs';
import { AuthenticatorService } from '../service/authenticator.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogUtils } from '../util/Dialog.utils';
import { environment } from '../../environments/environment.prod';
import { SnackBarUtils } from '../util/SnackBar.utils';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard /*, CanActivateChild, CanDeactivate<unknown>, CanLoad */
{
  firstStarted = true;
  
  constructor(
    private authenticatorService: AuthenticatorService, 
    private router: Router,
    private dialogUtils: DialogUtils,
    private snackBarUtils: SnackBarUtils
  ){}

  delayUntilReadyOrTimeout(
    readySignal$: Observable<any>,
    maxWaitMs: number = 3000,
    timeoutTrigger?: () => void
  ): Observable<boolean> {
    return race(
      timer(maxWaitMs).pipe(map(() => {
        if(timeoutTrigger) {
          timeoutTrigger();
        }
        return false
      })), // timeout
      readySignal$.pipe(take(1), map(() => true)) // ready
    ).pipe(
      take(1)
    );
  }

  private getAuthInitializationSignal(): Observable<any> {
    return this.authenticatorService.authEvents$;
  }

  private checkAuthentication(): Observable<boolean> {
    if (this.authenticatorService.isAuthenticatedSync()) {
      return of(true);
    } else {
      // Store the attempted URL for redirecting after login
      // sessionStorage.setItem('redirectUrl', url);
      this.router.navigate([environment.endpoint_login]);
      return of(false);
    }
  }

  isLogin(): Observable<boolean> | Promise<boolean> | boolean {
    if(this.authenticatorService.isInitialized() || !this.authenticatorService.hasSessionRefreshToken()) {
      return this.checkAuthentication();
    }
    else {
      return firstValueFrom(
        this.delayUntilReadyOrTimeout(this.getAuthInitializationSignal(), 10000, () => {
          this.router.navigate([environment.endpoint_login]);
        }).pipe(
          switchMap(() => this.checkAuthentication())
        )
      );
    }
  }

  isChildLogin(): Observable<boolean> | Promise<boolean> | boolean {
    return this.isLogin();
  }

  private checkAuthenticationWithRole(role: string): Observable<boolean> {
    return this.authenticatorService.isAuthenticatedWithUserGroup$(role).pipe(
      take(1),
      tap(authorized => {
        if (!authorized) {
          this.router.navigate([environment.endpoint_login]);
        }
      })
    );
  }

  isLoginWithRole(role: string): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Resolve to a Promise (not a cold Observable): call sites wrap this in an
    // `async () =>` guard fn, and an Observable wrapped in a Promise is a truthy
    // object the router never subscribes — the check would silently pass.
    if(this.authenticatorService.isInitialized() || !this.authenticatorService.hasSessionRefreshToken()) {
      return firstValueFrom(this.checkAuthenticationWithRole(role));
    }
    else {
      return firstValueFrom(
        this.delayUntilReadyOrTimeout(this.getAuthInitializationSignal(), 10000, () => {
          this.router.navigate([environment.endpoint_login]);
        }).pipe(
          switchMap(() => this.checkAuthenticationWithRole(role))
        )
      );
    }
  }

  isChildLoginWithRole(role: string): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.isLoginWithRole(role);
  }

  /**
   * Authority-based route gate. Unauthenticated → /login; authenticated but
   * lacking the authority → snackbar + redirect home (UrlTree). Members of the
   * admin group pass (legacy fallback) unless adminFallback is false.
   *
   * Same Promise discipline as isLoginWithRole: call sites are
   * `async () => inject(AuthGuard).isLoginWithAuthority('orders:read')`, so a
   * cold Observable would be wrapped in the Promise as a truthy object and
   * never subscribed — both branches must resolve via firstValueFrom.
   */
  isLoginWithAuthority(authority: string | readonly string[], mode: 'any' | 'all' = 'any', adminFallback: boolean = true): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const checks = typeof authority === 'string' ? [authority] : authority;
    const decide = (): Observable<boolean | UrlTree> =>
      this.authenticatorService.isAuthenticatedWithAuthority$(checks, mode, adminFallback ? 'ADMIN' : null).pipe(
        take(1),
        map(authorized => {
          if (authorized) return true;
          if (this.authenticatorService.isAuthenticatedSync()) {
            this.snackBarUtils.openSnackBar('You do not have access to that section', 'OK', 4000);
            return this.router.createUrlTree([environment.endpoint_home]);
          }
          this.router.navigate([environment.endpoint_login]);
          return false;
        })
      );

    if(this.authenticatorService.isInitialized() || !this.authenticatorService.hasSessionRefreshToken()) {
      return firstValueFrom(decide());
    }
    return firstValueFrom(
      this.delayUntilReadyOrTimeout(this.getAuthInitializationSignal(), 10000, () => {
        this.router.navigate([environment.endpoint_login]);
      }).pipe(switchMap(() => decide()))
    );
  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    return this.isLogin();
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    return this.isLogin();
  }

  // canDeactivate(
  //   component: unknown,
  //   currentRoute: ActivatedRouteSnapshot,
  //   currentState: RouterStateSnapshot,
  //   nextState?: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
  //   return true;
  // }
  // canLoad(
  //   route: Route,
  //   segments: UrlSegment[]): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

  //   console.log('can load');

  //   return false;
  // }
}

export interface ComponentCanDeactivate {
  canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable({
    providedIn: 'root'
})
export class CanDeactivateGuard implements CanDeactivate<ComponentCanDeactivate> {

  canDeactivate(component: ComponentCanDeactivate): Observable<boolean> | Promise<boolean> | boolean {
    return component.canDeactivate ? component.canDeactivate() : true;
  }

  static canDeactivateDialog(isValueChange: boolean, matDialog: MatDialog | DialogUtils, errorTitle: string = 'Unsaved changes!', errorMessage: string = 'You have unsaved changes\nDo you want to discard them and leave?', yes: string = 'Yes', no: string = 'No', width: string = '100%', disableClose: boolean = false): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      if(isValueChange) {
        let confirm = await DialogUtils.openConfirmDialog(matDialog instanceof MatDialog ? matDialog : matDialog.matDialog, errorTitle, errorMessage, yes, no, width, disableClose);
        resolve(confirm ? true : false);
      }
      else {
        resolve(true);
      }
    })
  }
}
