import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { first, firstValueFrom } from 'rxjs';
import { AuthenticatorService } from '../../service/authenticator.service';
import { OpenIdProviderService } from '../../service/open-id-provider.service';
import { DialogUtils } from '../../util/Dialog.utils';
import { RxJSUtils } from '../../util/RxJS.utils';
import { OpenIDProvider } from '../../model/open-id.model';
import { StringUtils } from '../../util/String.utils';
import { FileUtils } from '../../util/File.utils';
import { RouteUtils } from '../../util/Route.utils';
import { environment } from 'projects/environments/environment.prod';

@Component({
  selector: 'viescloud-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  public static defaultStateKey = "ensible_auth_state";

  ensibleOpenIDProviders: OpenIDProvider[] = [];

  username = '';
  password = '';
  validForm = false;
  openIdLogin = false;

  loading = 'Logging in, please wait';
  count = 0;

  constructor(
    private authenticatorService: AuthenticatorService,
    private dialogUtils: DialogUtils,
    private router: Router,
    private ensibleOpenidService: OpenIdProviderService,
    private rxjsUtils: RxJSUtils
  ) { }

  async ngOnInit() {
    let code = RouteUtils.getQueryParam('code');
    let state = RouteUtils.getQueryParam('state');

    if(code && state) {
      this.openIdLogin = true;
      setInterval(() => {
        this.count++;
        if (this.count > 5) {
          this.count = 0;
          this.loading = 'Logging in, please wait';
        }
        else {
          this.loading += '.';
        }
      }, 500);
  
      let stateData = LoginComponent.getState();

      if (stateData?.key == state) {
        this.authenticatorService.loginOAuth2({ code: code, redirectUri: stateData.redirectUri, openIdProviderId: stateData.provider.id }, stateData.provider).subscribe({
          next: res => {
            this.router.navigate([environment.endpoint_home]);
          },
          error: err => {
            this.dialogUtils.openErrorMessageFromError(err);
          }
        });
      }
      else {
        await this.dialogUtils.openErrorMessage('Invalid Oath2 Callback state', 'Invalid Oath2 Callback state\nPlease try again latter', 'ok');
      }

      RouteUtils.deleteQueryParam('code', 'state');
      this.openIdLogin = false;
      this.ngOnInit();
    }
    else {
      this.ensibleOpenidService.getAllPublicProviders().pipe(this.rxjsUtils.waitLoadingDynamicStringSnackBar('Loading OpenID Providers ...')).subscribe({
        next: res => {
          this.ensibleOpenIDProviders = res;
        }
      })
    }

  }

  async login() {
    let success = false;

    if (this.validForm)
      await firstValueFrom(this.authenticatorService.login({ username: this.username, password: this.password }))
      .then(res => {
        success = true;
      })
      .catch(err => {
        this.dialogUtils.openErrorMessage("Login fail", "invalid username or password");
      });
    else
      this.dialogUtils.openErrorMessage("Invalid Form", "Invalid username or password")

    if (success) {
      this.router.navigate([environment.endpoint_home]);
    }
  }

  getRedirectUri() {
    return `${window.location.protocol}//${window.location.host}/oauth2`;
  }

  async loginWithProvider(provider: OpenIDProvider) {
    let authUri = provider.authorizationEndpoint;
    let clientId = provider.clientId;
    let responseType = 'code';
    let scope = 'openid+email+profile';
    let redirectUrl = encodeURIComponent(this.getRedirectUri());
    let state = StringUtils.makeId(20);
    FileUtils.localStorageSetItem(LoginComponent.defaultStateKey, { key: state, redirectUri: this.getRedirectUri(), provider: provider });

    let authenticationUrl = `${authUri}?client_id=${clientId}&response_type=${responseType}&scope=${scope}&redirect_uri=${redirectUrl}&state=${state}`;

    this.router.navigate(["/"]).then(result => { window.location.href = authenticationUrl; });
  }

  static setState(state: string, redirectUri: string, provider: OpenIDProvider) {
    FileUtils.localStorageSetItem(LoginComponent.defaultStateKey, { key: state, redirectUri: redirectUri, provider: provider });
  }

  static getState(): { key: string, redirectUri: string, provider: OpenIDProvider } | undefined {
    let state = FileUtils.localStorageGetItem(LoginComponent.defaultStateKey);
    FileUtils.localStorageRemoveItem(LoginComponent.defaultStateKey);
    return state as { key: string, redirectUri: string, provider: OpenIDProvider } | undefined;
  }
}
