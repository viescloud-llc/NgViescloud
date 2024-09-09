import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UtilsService } from './Utils.service';
import { environment } from 'projects/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class PinterestService {

  tokenUri = 'https://api.pinterest.com/v5/oauth/token';
  oathUri = 'https://www.pinterest.com/oauth/';

  constructor(httpClient: HttpClient, private router: Router) {
    
  }

    authorizeFlow(): void {
    let oathUri = this.oathUri;
    let clientId = environment.pinterest_client_id;
    let responseType = 'code';
    // let scope = 'ads:read,ads:write,biz_access:read,biz_access:write,boards:read,boards:read_secret,boards:write,boards:write_secret,catalogs:read,catalogs:write,pins:read,pins:read_secret,pins:write,pins:write_secret,user_accounts:read';
    let scope = 'ads:read,ads:write,boards:read,boards:read_secret,boards:write,boards:write_secret,pins:read,pins:read_secret,pins:write,pins:write_secret,user_accounts:read';
    let redirectUrl = encodeURIComponent(this.getRedirectUri());
    let state = UtilsService.makeId(20);
    let authenticationUrl = `${oathUri}?client_id=${clientId}&response_type=${responseType}&scope=${scope}&redirect_uri=${redirectUrl}&state=${state}`;
    this.router.navigate(["/"]).then(result=>{window.location.href = authenticationUrl;});
  }

  getRedirectUri() {
    return `${window.location.protocol}//${window.location.host}/oath/pinterest`;
  }
}
