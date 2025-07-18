import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { LoadingDialog } from '../dialog/loading-dialog/loading-dialog.component';
import { ConfirmDialog } from '../dialog/confirm-dialog/confirm-dialog.component';
import { Injectable } from '@angular/core';
import { MatOption } from '../model/mat.model';
import { NotAuthenticatedError, ViesErrorResponse } from '../model/error.model';
import { InputDialog } from '../dialog/input-dialog/input-dialog.component';
import { DataUtils } from './Data.utils';
import { Observable } from 'rxjs';
import {
  UserAccess,
  SharedUser,
  SharedGroup,
  AccessPermission,
} from '../model/authenticator.model';
import { UserAccessInputType } from '../util-component/mat-form-field-input-user-access/mat-form-field-input-user-access.component';
import { UserAccessDialog } from '../dialog/user-access-dialog/user-access-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class DialogUtils {
  constructor(public matDialog: MatDialog) {}

  openLoadingDialog(timeout?: number, disableClose: boolean = true) {
    return DialogUtils.openLoadingDialog(this.matDialog, timeout, disableClose);
  }

  static openLoadingDialog(
    matDialog: MatDialog,
    timeout?: number,
    disableClose: boolean = true
  ): MatDialogRef<LoadingDialog, any> {
    let dialog = matDialog.open(LoadingDialog, {
      disableClose: disableClose,
    });

    dialog.afterClosed().subscribe({
      next: () => {},
    });

    if (timeout) {
      setTimeout(() => {
        dialog.close();
      }, timeout);
    }

    return dialog;
  }

  openErrorMessageFromError(
    error: any,
    title: string = 'Error!',
    defaultMessage: string = 'An unexpected error has occurred'
  ) {
    return DialogUtils.openErrorMessageFromError(
      this.matDialog,
      error,
      title,
      defaultMessage
    );
  }

  static openErrorMessageFromError(
    matDialog: MatDialog,
    error: any,
    title: string = 'Error!',
    defaultMessage: string = 'An unexpected error has occurred'
  ) {
    if (DataUtils.isInstanceOf(error, new ViesErrorResponse())) {
      let err = error as ViesErrorResponse;
      return DialogUtils.openErrorMessage(
        matDialog,
        title,
        err.reason ?? defaultMessage
      );
    } else if (DataUtils.isInstanceOf(error.error, new ViesErrorResponse())) {
      let err = error.error as ViesErrorResponse;
      return DialogUtils.openErrorMessage(
        matDialog,
        title,
        err.reason ?? defaultMessage
      );
    } else {
      return DialogUtils.openErrorMessage(matDialog, title, defaultMessage);
    }
  }

  openErrorMessage(
    title: string,
    message: string,
    yes: string = 'OK',
    width: string = '99%',
    disableClose: boolean = false
  ) {
    return DialogUtils.openErrorMessage(
      this.matDialog,
      title,
      message,
      yes,
      width,
      disableClose
    );
  }

  static openErrorMessage(
    matDialog: MatDialog,
    title: string,
    message: string,
    yes: string = 'OK',
    width: string = '99%',
    disableClose: boolean = false
  ) {
    return this.openConfirmDialog(
      matDialog,
      title,
      message,
      yes,
      '',
      width,
      disableClose
    );
  }

  openConfirmDialog(
    title: string,
    message: string,
    yes: string = 'Yes',
    no: string = 'No',
    width: string = '99%',
    disableClose: boolean = false
  ) {
    return DialogUtils.openConfirmDialog(
      this.matDialog,
      title,
      message,
      yes,
      no,
      width,
      disableClose
    );
  }

  static openConfirmDialog(
    matDialog: MatDialog,
    title: string,
    message: string,
    yes: string = 'Yes',
    no: string = 'No',
    width: string = '99%',
    disableClose: boolean = false
  ) {
    return new Promise<string>((resolve, reject) => {
      let dialog = matDialog.open(ConfirmDialog, {
        disableClose: disableClose,
        data: {
          title: title,
          message: message,
          yes: yes,
          no: no,
        },
        width: width
      });

      dialog.afterClosed().subscribe({
        next: (result) => {
          if (result) resolve(result);
          else reject(result);
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  }

  openInputDialog(
    title: string,
    label: string,
    yes: string = 'Yes',
    no: string = 'No',
    multipleLine: boolean = false,
    input: string = '',
    placeholder: string = '',
    width: string = '99%',
    disableClose: boolean = false
  ) {
    return DialogUtils.openInputDialog(
      this.matDialog,
      title,
      label,
      yes,
      no,
      multipleLine,
      input,
      placeholder,
      width,
      disableClose
    );
  }

  static openInputDialog(
    matDialog: MatDialog,
    title: string,
    label: string,
    yes: string = 'Yes',
    no: string = 'No',
    multipleLine: boolean = false,
    input: string = '',
    placeholder: string = '',
    width: string = '99%',
    disableClose: boolean = false
  ) {
    return new Promise<string>((resolve, reject) => {
      let dialog = matDialog.open(InputDialog, {
        disableClose: disableClose,
        data: {
          title: title,
          label: label,
          yes: yes,
          no: no,
          multipleLine: multipleLine,
          input: input,
          placeholder: placeholder,
        },
        width: width,
      });

      dialog.afterClosed().subscribe({
        next: (result) => {
          if (result) resolve(result);
          else reject(result);
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  }

  // -------------------------Dyanmic Object Dialog-------------------------

  static openDynamicObjectDialog(
    matDialog: MatDialog,
    object: any,
    width: string = '99%',
    disableClose: boolean = false
  ) {
    //TODO
  }

  // -------------------------User Access Dialog-------------------------

  openUserAccessDialog<
    T extends UserAccess | SharedUser[] | SharedGroup[] | AccessPermission[]
  >(
    value: T,
    inputType: UserAccessInputType[] | UserAccessInputType,
    userIdOptions: MatOption<String>[] | Observable<MatOption<String>[]>,
    groupIdOptions: MatOption<String>[] | Observable<MatOption<String>[]>,
    readonly: boolean = false,
    title: string = 'User Access',
    yes: string = 'Save',
    no: string = 'Cancel',
    width: string = '99%',
    disableClose: boolean = false
  ) {
    return DialogUtils.openUserAccessDialog(
      this.matDialog,
      value,
      inputType,
      userIdOptions,
      groupIdOptions,
      readonly,
      title,
      yes,
      no,
      width,
      disableClose
    )
  }

  static openUserAccessDialog<
    T extends UserAccess | SharedUser[] | SharedGroup[] | AccessPermission[]
  >(
    matDialog: MatDialog,
    value: T,
    inputType: UserAccessInputType[] | UserAccessInputType,
    userIdOptions: MatOption<String>[] | Observable<MatOption<String>[]>,
    groupIdOptions: MatOption<String>[] | Observable<MatOption<String>[]>,
    readonly: boolean = false,
    title: string = 'User Access',
    yes: string = 'Save',
    no: string = 'Cancel',
    width: string = '99%',
    disableClose: boolean = false
  ) {
    return new Promise<T>((resolve, reject) => {
      let dialog = matDialog.open(UserAccessDialog, {
        data: {
          value: value,
          inputType: inputType,
          userIdOptions: userIdOptions,
          groupIdOptions: groupIdOptions,
          readonly: readonly,
          title: title,
          yes: yes,
          no: no,
        },
        width: width,
        disableClose: disableClose
      });

      dialog.afterClosed().subscribe({
        next: (result) => {
          if (result && DataUtils.isNotEqual(result, {})) resolve(result);
          else reject(result);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }
}
