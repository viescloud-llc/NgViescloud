import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, CanDeactivate, CanLoad, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable, filter, map } from 'rxjs';
import { AuthenticatorService } from '../service/Authenticator.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogUtils } from '../util/Dialog.utils';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard /*, CanActivateChild, CanDeactivate<unknown>, CanLoad */
{
  constructor(private authenticatorService: AuthenticatorService, private router: Router){}

  isLogin(): Observable<boolean> | Promise<boolean> | boolean {
    if(!this.authenticatorService.getJwt())
      return false;

    return this.authenticatorService.getCurrentLoginUser().pipe(
    map(user => {
      return user ? true : false;
    }));
  }

  isChildLogin(): Observable<boolean> | Promise<boolean> | boolean {
    if(!this.authenticatorService.getJwt())
      return false;

    return this.authenticatorService.getCurrentLoginUser().pipe(
    map(user => {
      return user ? true : false;
    }));
  }

  isLoginWithRole(role: string): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if(!this.authenticatorService.getJwt())
      return false;

    return this.authenticatorService.getCurrentLoginUser().pipe(
    map(user => {
      let isLogin = user ? true : false;
      let matchUserRole = this.authenticatorService.currentUser!.userRoles!.some(u => u.name?.toUpperCase() === role.toUpperCase());
      return isLogin && matchUserRole;
    }));
  }

  isChildLoginWithRole(role: string): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if(!this.authenticatorService.getJwt())
    return false;

    return this.authenticatorService.getCurrentLoginUser().pipe(
    map(user => {
      let isLogin = user ? true : false;
      let matchUserRole = this.authenticatorService.currentUser!.userRoles!.some(u => u.name?.toUpperCase() === role.toUpperCase());
      return isLogin && matchUserRole;
    }));
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
