import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, CanDeactivate, CanLoad, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable, catchError, delay, filter, first, firstValueFrom, map, of, race, switchMap, take, tap, timer } from 'rxjs';
import { AuthenticatorService } from '../service/authenticator.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogUtils } from '../util/Dialog.utils';
import { environment } from 'projects/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard /*, CanActivateChild, CanDeactivate<unknown>, CanLoad */
{
  firstStarted = true;
  
  constructor(
    private authenticatorService: AuthenticatorService, 
    private router: Router,
    private dialogUtils: DialogUtils
  ){}

  delayUntilReadyOrTimeout(
    readySignal$: Observable<any>,
    maxWaitMs: number = 3000
  ): Observable<boolean> {
    return race(
      timer(maxWaitMs).pipe(map(() => false)), // timeout
      readySignal$.pipe(take(1), map(() => true)) // ready
    ).pipe(
      take(1)
    );
  }

  private getAuthInitializationSignal(): Observable<any> {
    return this.authenticatorService.authEvents;
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
        this.delayUntilReadyOrTimeout(this.getAuthInitializationSignal(), 10000).pipe(
          switchMap(() => this.checkAuthentication())
        )
      );
    }
  }

  isChildLogin(): Observable<boolean> | Promise<boolean> | boolean {
    return this.isLogin();
  }

  isLoginWithRole(role: string): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.authenticatorService.isAuthenticatedWithUserGroup$(role);
  }

  isChildLoginWithRole(role: string): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.authenticatorService.isAuthenticatedWithUserGroup$(role);
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
