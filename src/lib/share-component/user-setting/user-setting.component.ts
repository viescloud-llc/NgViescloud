import { RxJSUtils } from '../../util/RxJS.utils';
import { Component, inject, OnInit } from '@angular/core';
import { DialogUtils } from '../../util/Dialog.utils';
import { AuthenticatorService } from '../../service/authenticator.service';
import { ViesMatFormFieldMap } from '../../abtract/ViesMatFormFieldMap';

@Component({
  selector: 'app-user-setting',
  templateUrl: './user-setting.component.html',
  styleUrls: ['./user-setting.component.scss'],
  standalone: false
})
export class UserSettingComponent extends ViesMatFormFieldMap implements OnInit {

  currentPassword = '';
  newPassword = '';
  reNewPassword = '';
  alias = '';
  aliasCopy = '';

  error = '';
  validForm = false;
  validForm2 = false;

  ensibleAuthenticatorService = inject(AuthenticatorService);
  rxjsUtils: RxJSUtils = inject(RxJSUtils);
  dialogUtils: DialogUtils = inject(DialogUtils);

  ngOnInit(): void {
    this.currentPassword = '';
    this.newPassword = '';
    this.reNewPassword = '';
    this.alias = this.ensibleAuthenticatorService.getCurrentUserAliasOrUsername();
    this.aliasCopy = structuredClone(this.alias);

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
      this.ensibleAuthenticatorService.updatePassword({currentPassword: this.currentPassword, newPassword: this.newPassword}).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
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
      this.ensibleAuthenticatorService.updateAlias({alias: this.alias}).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
        next: res => {
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
