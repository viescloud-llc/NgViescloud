import { AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, Inject, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AuthenticatorService } from '../../service/Authenticator.service';
import { User, UserProfile, UserRole } from '../../model/Authenticator.model';
import { first, isEmpty } from 'rxjs';
import { MatFormFieldInputComponent } from '../../util-component/mat-form-field-input/mat-form-field-input.component';
import { MatFormFieldGroupDirective } from '../../directive/mat-form-field-group.directive';

@Component({
  selector: 'app-user-dialog',
  templateUrl: './user-dialog.component.html',
  styleUrls: ['./user-dialog.component.scss']
})
export class UserDialog implements OnInit, AfterViewChecked {

  user!: User; // to be change
  userClone!: User; // original
  blankUser: User = new User();

  userRoles: UserRole[] = [];

  usernameExist: boolean = false;

  usernameError: string = '';

  validInputs: boolean = false;
  validForm: boolean = false;
  
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {userId: number},
    private dialogRef: MatDialogRef<UserDialog>,
    private authenticatorService: AuthenticatorService,
    private cd: ChangeDetectorRef
  ) { }
  
  ngAfterViewChecked(): void {
    this.checkValidForm();
  }

  ngOnInit() {
    let id = this.data.userId;
    this.authenticatorService.getUserRoles().pipe(first()).subscribe(
      res => this.userRoles = res,
      error => {}
    );

    if(id === 0) {
      this.user = new User();
      this.userClone = structuredClone(this.user);
    }
    else {
      this.authenticatorService.getUser(id).pipe(first()).subscribe(
        res => {
          this.user = res; 
          if(!this.user.userProfile)
            this.user.userProfile = new UserProfile();
          this.userClone = structuredClone(this.user);
        },
        error => this.dialogRef.close()
      );
    }
    
  }

  checkValidForm(): void {
    this.validForm = this.validInputs && this.isValueChange();
    this.cd.detectChanges();
  }

  checkUsername(): void
  {
    if(this.user.username)
      this.authenticatorService.isUsernameExist(this.user.username).pipe(first()).subscribe(
        res => this.usernameExist = true,
        error => this.usernameExist = false
      );
  }

  isValueChange(): boolean
  {
    return JSON.stringify(this.user) !== JSON.stringify(this.userClone);
  }

  isValueNotChange(): boolean
  {
    return JSON.stringify(this.user) === JSON.stringify(this.userClone);
  }

  revert()
  {
    this.user = structuredClone(this.userClone);
  }

  save(): void
  {
    if(!this.validForm)
      return;

    if(this.user.id === 0) {
      this.authenticatorService.postUser(this.user).pipe(first()).subscribe(
        res => {
          this.dialogRef.close('save')
        },
        err => {
          window.alert('Technical difficulty, please try again latter');
          this.dialogRef.close('');
        }
      );
    }
    else {
      this.authenticatorService.patchUser(this.user).pipe(first()).subscribe(
        res => {
          this.dialogRef.close('save')
        },
        err => {
          window.alert('Technical difficulty, please try again latter');
          this.dialogRef.close('');
        }
      );
    }
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

  addNewRole(): void {
    const random = Math.floor(Math.random() * this.userRoles.length);
    let role = structuredClone(this.userRoles[random]);
    this.user.userRoles!.push(role);
  }

  removeUserRole(index: number) {
    this.user.userRoles!.splice(index, 1);
  }

  clearExpire() {
    this.user.expireTime = undefined;
  }
}
