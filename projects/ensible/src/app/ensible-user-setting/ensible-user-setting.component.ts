import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { EnsibleAuthenticatorService } from './../service/ensible-authenticator/ensible-authenticator.service';
import { Component, OnInit } from '@angular/core';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';

@Component({
  selector: 'app-ensible-user-setting',
  templateUrl: './ensible-user-setting.component.html',
  styleUrls: ['./ensible-user-setting.component.scss']
})
export class EnsibleUserSettingComponent implements OnInit {

  currentPassword = '';
  newPassword = '';
  reNewPassword = '';
  alias = '';

  error = '';
  validForm = false;
  validForm2 = false;

  constructor(
    private ensibleAuthenticatorService: EnsibleAuthenticatorService,
    private rxjsUtils: RxJSUtils,
    private dialogUtils: DialogUtils
  ) { }

  ngOnInit(): void {
    this.currentPassword = '';
    this.newPassword = '';
    this.reNewPassword = '';
    this.alias = this.ensibleAuthenticatorService.user?.alias ?? '';

    this.error = '';
    this.validForm = false;
    this.validForm2 = false;
  }

  isValidForm() {
    if(this.newPassword !== this.reNewPassword) {
      this.error = 'New password and retype password not match';
      return false;
    }

    this.error = '';
    return this.validForm;
  }

  changePassword() {
    if(this.isValidForm()) {
      this.ensibleAuthenticatorService.changeCurrentLoginUserPassword(this.currentPassword, this.newPassword).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
        next: res => {
          this.ngOnInit();
          this.dialogUtils.openConfirmDialog('Success', 'Password changed!\nNext time you login, please use new password', 'Ok', '');
        },
        error: err => {
          this.dialogUtils.openErrorMessageFromError(err);
        }
      });
    }
  }

  changeAlias() {
    if(this.validForm2) {
      this.ensibleAuthenticatorService.changeCurrentLoginUserAlias(this.alias).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
        next: res => {
          this.ensibleAuthenticatorService.ngOnInit();
          this.ngOnInit();
          this.dialogUtils.openConfirmDialog('Success', 'Alias changed!', 'Ok', '');
        },
        error: err => {
          this.dialogUtils.openErrorMessageFromError(err);
        }
      });
    }
  }
}
