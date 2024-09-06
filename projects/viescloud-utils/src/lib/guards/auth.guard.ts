import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, CanDeactivate, CanLoad, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable, filter, map } from 'rxjs';
import { AuthenticatorService } from '../service/Authenticator.service';

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
