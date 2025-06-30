import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserAccessInputType } from '../../util-component/mat-form-field-input-user-access/mat-form-field-input-user-access.component';
import { MatOption } from '../../model/mat.model';
import { Observable } from 'rxjs';
import { UserAccess, SharedUser, SharedGroup, AccessPermission } from '../../model/authenticator.model';
import { RxJSUtils } from '../../util/RxJS.utils';
import { FixChangeDetection } from '../../abtract/FixChangeDetection';

@Component({
  selector: 'app-user-access-dialog',
  templateUrl: './user-access-dialog.component.html',
  styleUrls: ['./user-access-dialog.component.scss'],
  standalone: false
})
export class UserAccessDialog extends FixChangeDetection {

  value!: UserAccess | SharedUser[] | SharedGroup[] | AccessPermission[];
  inputType!: UserAccessInputType[] | UserAccessInputType;
  userIdOptions: MatOption<String>[] = [];
  groupIdOptions: MatOption<String>[] = [];
  readonly: boolean = false;

  title: string = 'User Access';
  yes: string = 'Save';
  no: string = 'Cancel';

  validForm: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      value: UserAccess | SharedUser[] | SharedGroup[] | AccessPermission[],
      inputType: UserAccessInputType[] | UserAccessInputType,
      userIdOptions: MatOption<String>[] | Observable<MatOption<String>[]>,
      groupIdOptions: MatOption<String>[] | Observable<MatOption<String>[]>,
      readonly?: boolean,
      title?: string,
      yes?: string,
      no?: string
    },
    private rxjsUtils: RxJSUtils,
    private dialogRef: MatDialogRef<UserAccessDialog>,
  ) {
    super();

    this.value = data.value;
    this.inputType = data.inputType;

    if(data.title)
      this.title = data.title;

    if(data.yes)
      this.yes = data.yes;

    if(data.no)
      this.no = data.no;

    if(data.readonly)
      this.readonly = data.readonly;

    if(data.userIdOptions instanceof Observable) {
      data.userIdOptions.pipe(this.rxjsUtils.waitLoadingDialog()).subscribe(e => this.userIdOptions = e);
    }
    else {
      this.userIdOptions = data.userIdOptions;
    }

    if(data.groupIdOptions instanceof Observable) {
      data.groupIdOptions.pipe(this.rxjsUtils.waitLoadingDialog()).subscribe(e => this.groupIdOptions = e);
    }
    else {
      this.groupIdOptions = data.groupIdOptions;
    }
  }
}
