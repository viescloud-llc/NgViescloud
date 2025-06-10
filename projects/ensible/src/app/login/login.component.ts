import { EnsibleOpenIDProvider } from './../model/ensible.model';
import { Component, OnInit } from '@angular/core';
import { EnsibleAuthenticatorService } from '../service/ensible-authenticator/ensible-authenticator.service';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { Route, Router } from '@angular/router';
import { EnsibleOpenIdProviderService } from '../service/ensible-open-id-provider/ensible-open-id-provider.service';
import { StringUtils } from 'projects/viescloud-utils/src/lib/util/String.utils';
import { FileUtils } from 'projects/viescloud-utils/src/lib/util/File.utils';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  public static defaultStateKey = "ensible_auth_state";

  ensibleOpenIDProviders: EnsibleOpenIDProvider[] = [];

  username = '';
  password = '';
  validForm = false;

  constructor(
    private authenticatorService: EnsibleAuthenticatorService,
    private dialogUtils: DialogUtils,
    private router: Router,
    private ensibleOpenidService: EnsibleOpenIdProviderService,
    private rxjsUtils: RxJSUtils
  ) { }

  ngOnInit() {
    this.ensibleOpenidService.getAllPublicProviders().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.ensibleOpenIDProviders = res;
      }
    })
  }

  async login() {
    if(this.validForm)
      await this.authenticatorService.autoLogin(this.username, this.password);
    else
      this.dialogUtils.openErrorMessage("Invalid Form", "Invalid username or password")

    this.router.navigate(['home']);
  }

  getRedirectUri() {
    return `${window.location.protocol}//${window.location.host}/oauth2`;
  }

  async loginWithProvider(provider: EnsibleOpenIDProvider) {
    let authUri = provider.authorizationEndpoint;
    let clientId = provider.clientId;
    let responseType = 'code';
    let scope = 'openid+email+profile';
    let redirectUrl = encodeURIComponent(this.getRedirectUri());
    let state = StringUtils.makeId(20);
    FileUtils.localStorageSetItem(LoginComponent.defaultStateKey, {key: state, redirectUri: this.getRedirectUri(), provider: provider});

    let authenticationUrl = `${authUri}?client_id=${clientId}&response_type=${responseType}&scope=${scope}&redirect_uri=${redirectUrl}&state=${state}`;

    this.router.navigate(["/"]).then(result=>{window.location.href = authenticationUrl;});
  }

  static setState(state: string, redirectUri: string, provider: EnsibleOpenIDProvider) {
    FileUtils.localStorageSetItem(LoginComponent.defaultStateKey, {key: state, redirectUri: redirectUri, provider: provider});
  }

  static getState(): {key: string, redirectUri: string, provider: EnsibleOpenIDProvider} | undefined {
    let state = FileUtils.localStorageGetItem(LoginComponent.defaultStateKey);
    // FileUtils.localStorageRemoveItem(LoginComponent.defaultStateKey);
    return state as {key: string, redirectUri: string, provider: EnsibleOpenIDProvider} | undefined;
  }
}
