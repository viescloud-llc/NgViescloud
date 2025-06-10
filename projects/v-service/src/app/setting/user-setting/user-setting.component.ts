import { AfterViewChecked, ChangeDetectorRef, Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { first } from 'rxjs';
import { ConfirmDialog } from 'projects/viescloud-utils/src/lib/dialog/confirm-dialog/confirm-dialog.component';
import { User } from 'projects/viescloud-utils/src/lib/model/Authenticator.model';
import { AuthenticatorService } from 'projects/viescloud-utils/src/lib/service/authenticator.service';

@Component({
  selector: 'app-user-setting',
  templateUrl: './user-setting.component.html',
  styleUrls: ['./user-setting.component.scss']
})
export class UserSettingComponent implements OnInit, AfterViewChecked {

  user!: User;
  userClone!: User;

  usernameError = '';

  currentPassword = '';
  newPassword = '';
  reNewPassword = '';

  validInfoForm = false;

  constructor(
    private authenticatorService: AuthenticatorService,
    private cd: ChangeDetectorRef,
    private matDialog: MatDialog
  ) { }
  
  ngAfterViewChecked(): void {
    this.cd.detectChanges();
  }

  ngOnInit() {
    this.init();
  }

  init() {
    this.authenticatorService.getCurrentLoginUser().pipe(first()).subscribe(
      res => {
        if(this.isChange(res, this.user)) {
          this.user = res;
          this.userClone = structuredClone(res);
        }
      }
    );
  }

  isChange(o1: any, o2: any) {
    return JSON.stringify(o1) !== JSON.stringify(o2);
  }

  validateUsername() {
    if(this.user.username === this.userClone.username || !this.user.username) {
      this.usernameError = "";
      return;
    }

    this.authenticatorService.isUsernameExist(this.user.username!).pipe(first()).subscribe(
      res => {
        this.usernameError = res.exist ? "Username already exist" : "";
      },
      error => {}
    );
  }

  saveInfo() {
    if(!this.validInfoForm)
      return;

    this.authenticatorService.patchCurrentUser(this.user).pipe(first()).subscribe(
      res => {
        this.user = res;
        this.userClone = structuredClone(res);

        let dialog = this.matDialog.open(ConfirmDialog, {data: {title: 'Updated user information', message: 'User information have been updated', no: ''}});
        dialog.afterClosed().pipe(first()).subscribe(res => {});
      },
      err => {
        window.alert('Technical difficulty, please try again latter');
      }
    );
  }

  isValueChange(): boolean {
    return this.isChange(this.user, this.userClone);
  }

  revert() {
    this.user = structuredClone(this.userClone);
  }
}
