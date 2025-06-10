import { Component, OnInit } from '@angular/core';
import { EnsibleAuthenticatorService } from '../service/ensible-authenticator/ensible-authenticator.service';
import { RouteUtils } from 'projects/viescloud-utils/src/lib/util/Route.utils';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { Router } from '@angular/router';
import { LoginComponent } from '../login/login.component';

@Component({
  selector: 'app-ensible-openid-login',
  templateUrl: './ensible-openid-login.component.html',
  styleUrls: ['./ensible-openid-login.component.scss']
})
export class EnsibleOpenidLoginComponent implements OnInit {

  loading = 'Logging in, please wait';
  count = 0;

  constructor(
    private authenticatorService: EnsibleAuthenticatorService,
    private dialogUtils: DialogUtils,
    private router: Router
  ) { }

  async ngOnInit() {
    setInterval(() => {
      this.count++;
      if(this.count > 5) {
        this.count = 0;
        this.loading = 'Logging in, please wait';
      }
      else {
        this.loading += '.';
      }
    }, 500);

    let code = RouteUtils.getQueryParam('code');
    let state = RouteUtils.getQueryParam('state');
    let errorMessage = '';
    let errorTitle = '';

    if(code && state) {
      let stateData = LoginComponent.getState();

      if(stateData?.key == state) {
        this.authenticatorService.oauth2Login(code, stateData.redirectUri, stateData.provider.id).subscribe({
          next: res => {
            this.authenticatorService.autoLoginWithJwt(res.jwt).then(() => {
              this.router.navigate(['home']);
            });
          }
        });
      }
      else {
        errorTitle = 'Invalid Oath2 Callback state';
        errorMessage = 'Invalid Oath2 Callback state\nPlease try again latter';
      }
    }
    else {
      errorTitle = 'Invalid Oath2 Callback from provider';
      errorMessage = 'Error when login with Oath2 from provider\nPlease try again latter';
    }

    if(errorMessage) {
      let confirm = await this.dialogUtils.openErrorMessage('Error', errorMessage, 'Ok', '100%', true);

      if(confirm) {
        this.router.navigate(['login']);
      }
    }
  }
}
