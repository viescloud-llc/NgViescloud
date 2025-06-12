import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, CanDeactivate, CanLoad, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable, delay, filter, map, of, race, switchMap, take, tap, timer } from 'rxjs';
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

  delayUntilEither<T>(
    cancel$: Observable<any>,
    maxDelayMs: number
  ) {
    return (source: Observable<T>) => source.pipe(
      switchMap(value =>
        race([
          timer(maxDelayMs),
          cancel$
        ]).pipe(switchMap(() => of(value)))
      )
    );
  }

  isLogin(): Observable<boolean> | Promise<boolean> | boolean {
    return this.authenticatorService.isAuthenticated.pipe(
      this.delayUntilEither(this.authenticatorService.isAuthenticated, this.firstStarted ? 5000 : 0),
      tap(() => this.firstStarted = false),
      take(1),
      map(isAuthenticated => {
        if (!isAuthenticated) {
          this.router.navigate([environment.endpoint_login]);
          return false;
        }
        return true;
      })
    );
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
