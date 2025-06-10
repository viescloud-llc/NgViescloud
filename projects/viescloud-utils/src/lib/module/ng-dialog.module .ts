import { NgModule } from '@angular/core';
import { ConfirmDialog } from '../dialog/confirm-dialog/confirm-dialog.component';
import { InputDialog } from '../dialog/input-dialog/input-dialog.component';
import { NgMaterialModule } from './ng-material.module';
import { NgEssentialModule } from './ng-essential.module';
import { NgComponentModule } from './ng-component.module';
import { ObjectDialog } from '../dialog/object-dialog/object-dialog.component';
import { LoadingDialog } from '../dialog/loading-dialog/loading-dialog.component';
import { StringSnackBar } from '../snack/string-snack-bar/string-snack-bar.component';
import { MessagePopup } from '../popup/message-popup/message-popup.component';
import { UserAccessDialog } from '../dialog/user-access-dialog/user-access-dialog.component';

const DIALOG = [
  ConfirmDialog,
  InputDialog,
  ObjectDialog,
  LoadingDialog,
  UserAccessDialog
]

const SNACK = [
  StringSnackBar
]

const POPUP = [
  MessagePopup
]

@NgModule({
  declarations: [
    ...DIALOG,
    ...SNACK,
    ...POPUP
  ],
  imports: [
    NgMaterialModule,
    NgEssentialModule,
    NgComponentModule
  ],
  exports: [
    ...DIALOG,
    ...SNACK
  ]
})
export class NgDialogModule { }
