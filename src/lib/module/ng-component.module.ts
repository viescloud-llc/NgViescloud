import { NgModule } from '@angular/core';
import { CopyToClipboardUtilComponent } from '../util-component/copy-to-clipboard-util/copy-to-clipboard-util.component';
import { InputTypeSwitchComponent } from '../util-component/input-type-switch/input-type-switch.component';
import { MatFormFieldInputComponent } from '../util-component/mat-form-field-input/mat-form-field-input.component';
import { NgEssentialModule } from './ng-essential.module';
import { NgMaterialModule } from './ng-material.module';
import { CopyToClipboardDirective } from '../directive/copy-to-clipboard.directive';
import { FilterNamePipe } from '../pipes/filter-name.pipe';
import { FilterNameReversePipe } from '../pipes/filter-name-reverse.pipe';
import { MatTableComponent } from '../util-component/mat-table/mat-table.component';
import { MatFormFieldGroupDirective } from '../directive/mat-form-field-group.directive';
import { MatFormFieldInputTextAreaComponent } from '../util-component/mat-form-field-input-text-area/mat-form-field-input-text-area.component';
import { MatFormFieldComponent } from '../util-component/mat-form-field/mat-form-field.component';
import { MatFormFieldInputTimeComponent } from '../util-component/mat-form-field-input-time/mat-form-field-input-time.component';
import { MatFormFieldInputOptionComponent } from '../util-component/mat-form-field-input-option/mat-form-field-input-option.component';
import { MatFormFieldInputListComponent } from '../util-component/mat-form-field-input-list/mat-form-field-input-list.component';
import { MatFormFieldInputDynamicComponent } from '../util-component/mat-form-field-input-dynamic/mat-form-field-input-dynamic.component';
import { MatFormFieldInputListOptionComponent } from '../util-component/mat-form-field-input-list-option/mat-form-field-input-list-option.component';
import { HeaderComponent } from '../share-component/header/header.component';
import { LoginComponent } from '../share-component/login/login.component';
import { SideDrawerMenuComponent } from '../share-component/side-drawer-menu/side-drawer-menu.component';
import { QuickSideDrawerMenuComponent } from '../share-component/quick-side-drawer-menu/quick-side-drawer-menu.component';
import { ClickStopPropagationDirective } from '../directive/ClickStopPropagation.directive';
import { TooltipDirective } from '../directive/Tooltip.directive';
import { ApplicationSettingComponent } from '../share-component/application-setting/application-setting.component';
import { MatFormFieldInputRgbColorPickerComponent } from '../util-component/mat-form-field-input-rgb-color-picker/mat-form-field-input-rgb-color-picker.component';
import { DisableKeyCaptureOnInputDirective } from '../directive/DisableKeyCaptureOnInput.directive';
import { CodeEditorComponent } from '../util-component/code-editor/code-editor.component';
import { MatTablePathComponent } from '../util-component/mat-table-path/mat-table-path.component';
import { MatFormFieldInputRecordComponent } from '../util-component/mat-form-field-input-record/mat-form-field-input-record.component';
import { MatFormFieldInputUserAccessComponent } from '../util-component/mat-form-field-input-user-access/mat-form-field-input-user-access.component';
import { MatTableDynamicComponent } from '../util-component/mat-table-dynamic/mat-table-dynamic.component';
import { MatTablePathLazyComponent } from '../util-component/mat-table-path-lazy/mat-table-path-lazy.component';
import { MatTableLazyComponent } from '../util-component/mat-table-lazy/mat-table-lazy.component';
import { OpenIdProviderComponent } from '../share-component/open-id-provider/open-id-provider.component';
import { UserGroupListComponent } from '../share-component/user-group-list/user-group-list.component';
import { UserListComponent } from '../share-component/user-list/user-list.component';
import { UserSettingComponent } from '../share-component/user-setting/user-setting.component';
import { UserAccessComponent } from '../share-component/user-access/user-access.component';
import { MatTableDynamicViesServiceComponent } from '../util-component/mat-table-dynamic-vies-service/mat-table-dynamic-vies-service.component';
import { MatTableLazyDynamicComponent } from '../util-component/mat-table-lazy-dynamic/mat-table-lazy-dynamic.component';
import { MatFormFieldInputDynamicFormComponent } from '../util-component/mat-form-field-input-dynamic-form/mat-form-field-input-dynamic-form.component';
import { MatFormFieldFormComponent } from '../util-component/mat-form-field-form/mat-form-field-form.component';

const UTILS = [
  CopyToClipboardUtilComponent,
  InputTypeSwitchComponent,
  MatFormFieldInputComponent,
  CopyToClipboardDirective,
  FilterNamePipe,
  FilterNameReversePipe,
  MatTableComponent,
  MatTableLazyComponent,
  MatTableDynamicComponent,
  MatFormFieldGroupDirective,
  MatFormFieldComponent,
  MatFormFieldFormComponent,
  MatFormFieldInputTextAreaComponent,
  MatFormFieldInputTimeComponent,
  MatFormFieldInputOptionComponent,
  MatFormFieldInputListComponent,
  MatFormFieldInputDynamicComponent,
  MatFormFieldInputDynamicFormComponent,
  MatFormFieldInputListOptionComponent,
  MatFormFieldInputRgbColorPickerComponent,
  MatFormFieldInputRecordComponent,
  MatFormFieldInputUserAccessComponent,
  ClickStopPropagationDirective,
  TooltipDirective,
  ApplicationSettingComponent,
  DisableKeyCaptureOnInputDirective,
  CodeEditorComponent,
  MatTablePathComponent,
  MatTablePathLazyComponent,
  MatTableDynamicViesServiceComponent,
  MatTableLazyDynamicComponent
]

const COMPONENTS = [
  HeaderComponent,
  LoginComponent,
  OpenIdProviderComponent,
  SideDrawerMenuComponent,
  QuickSideDrawerMenuComponent,
  UserGroupListComponent,
  UserListComponent,
  UserSettingComponent,
  UserAccessComponent
]

@NgModule({
  declarations: [
    ...UTILS,
    ...COMPONENTS
  ],
  imports: [
    NgMaterialModule,
    NgEssentialModule,
  ],
  exports: [
    ...UTILS,
    ...COMPONENTS,
    NgMaterialModule,
    NgEssentialModule
  ]
})
export class NgComponentModule { }
