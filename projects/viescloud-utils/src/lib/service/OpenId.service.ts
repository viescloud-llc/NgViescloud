import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class OpenIdService {
  code: string = "";
  state: string = "";

  constructor(private router: Router) { }

  getRedirectUri() {
    return `${window.location.protocol}//${window.location.host}/openId`;
  }

  logoutFlow(): void {
    let logoutUri = environment.authentik_openid_logout_url;
    this.router.navigate(["/"]).then(result=>{window.location.href = logoutUri;});
  }

  authorizeFlow(): void {
    let authentikUrl = environment.authentik_openid_url;
    let clientId = environment.authentik_client_id;
    let responseType = 'code';
    let scope = 'openid+email+profile';
    let redirectUrl = encodeURIComponent(this.getRedirectUri());
    let state = this.makeId(20);

    let authenticationUrl = `${authentikUrl}?client_id=${clientId}&response_type=${responseType}&scope=${scope}&redirect_uri=${redirectUrl}&state=${state}`;
    
    this.router.navigate(["/"]).then(result=>{window.location.href = authenticationUrl;});
  }

  makeId(length: number): string {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }

}
