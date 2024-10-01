import { NgModule } from '@angular/core';
import { ConfirmDialog } from '../dialog/confirm-dialog/confirm-dialog.component';
import { InputDialog } from '../dialog/input-dialog/input-dialog.component';
import { NgMaterialModule } from './ng-material.module';
import { NgEssentialModule } from './ng-essential.module';
import { NgComponentModule } from './ng-component.module';
import { LobbyDialog } from '../dialog/lobby-dialog/lobby-dialog.component';
import { UserDialog } from '../dialog/user-dialog/user-dialog.component';
import { QuestionDialog } from '../dialog/question-dialog/question-dialog.component';
import { OrganizationRoleDialog } from '../dialog/organization/organization-role-dialog/organization-role-dialog.component';
import { ObjectDialog } from '../dialog/object-dialog/object-dialog.component';
import { OrganizationUserDialog } from '../dialog/organization/organization-user-dialog/organization-user-dialog.component';
import { LoadingDialog } from '../dialog/loading-dialog/loading-dialog.component';
import { ProductDialog } from '../dialog/marketing/product-dialog/product-dialog.component';
import { WrapDialog } from '../dialog/wrap-dialog/wrap-dialog.component';
import { WrapLinkDialog } from '../dialog/wrap-link-dialog/wrap-link-dialog.component';
import { StringSnackBar } from '../snack/string-snack-bar/string-snack-bar.component';

const DIALOG = [
  ConfirmDialog,
  InputDialog,
  LobbyDialog,
  UserDialog,
  QuestionDialog,
  OrganizationRoleDialog,
  ObjectDialog,
  OrganizationUserDialog,
  LoadingDialog,
  ProductDialog,
  WrapDialog,
  WrapLinkDialog
]

const SNACK = [
  StringSnackBar
]

@NgModule({
  declarations: [
    ...DIALOG,
    ...SNACK
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
