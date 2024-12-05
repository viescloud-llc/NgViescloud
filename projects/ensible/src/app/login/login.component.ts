import { Component } from '@angular/core';
import { EnsibleAuthenticatorService } from '../service/ensible-authenticator/ensible-authenticator.service';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { Route, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username = '';
  password = '';
  validForm = false;

  constructor(
    private authenticatorService: EnsibleAuthenticatorService,
    private dialogUtils: DialogUtils,
    private router: Router
  ) { }

  async login() {
    if(this.validForm)
      await this.authenticatorService.autoLogin(this.username, this.password);
    else
      this.dialogUtils.openErrorMessage("Invalid Form", "Invalid username or password")

    this.router.navigate(['home']);
  }
}
