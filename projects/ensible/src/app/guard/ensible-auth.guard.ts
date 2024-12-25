import { EnsibleAuthenticatorService } from './../service/ensible-authenticator/ensible-authenticator.service';
import { EnsibleUserService } from './../service/ensible-user/ensible-user.service';
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EnsibleAuthGuard {

  constructor(
    private router: Router,
    private ensibleAuthenticatorService: EnsibleAuthenticatorService
  ) { }

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

  isLogin() {
    return this.ensibleAuthenticatorService.isLogin();
  }

  isNotLogin() {
    return !this.ensibleAuthenticatorService.isLogin();
  }
}
