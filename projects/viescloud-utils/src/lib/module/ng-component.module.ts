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
import { OpenIdComponent } from '../share-component/openId/openId.component';
import { SideDrawerMenuComponent } from '../share-component/side-drawer-menu/side-drawer-menu.component';
import { QuickSideDrawerMenuComponent } from '../share-component/quick-side-drawer-menu/quick-side-drawer-menu.component';
import { ClickStopPropagationDirective } from '../directive/ClickStopPropagation.directive';
import { TooltipDirective } from '../directive/Tooltip.directive';
import { ApplicationSettingComponent } from '../share-component/application-setting/application-setting.component';
import { MatFormFieldInputRgbColorPickerComponent } from '../util-component/mat-form-field-input-rgb-color-picker/mat-form-field-input-rgb-color-picker.component';

const UTILS = [
  CopyToClipboardUtilComponent,
  InputTypeSwitchComponent,
  MatFormFieldInputComponent,
  CopyToClipboardDirective,
  FilterNamePipe,
  FilterNameReversePipe,
  MatTableComponent,
  MatFormFieldGroupDirective,
  MatFormFieldComponent,
  MatFormFieldInputTextAreaComponent,
  MatFormFieldInputTimeComponent,
  MatFormFieldInputOptionComponent,
  MatFormFieldInputListComponent,
  MatFormFieldInputDynamicComponent,
  MatFormFieldInputListOptionComponent,
  MatFormFieldInputRgbColorPickerComponent,
  ClickStopPropagationDirective,
  TooltipDirective,
  ApplicationSettingComponent
]

const COMPONENTS = [
  HeaderComponent,
  LoginComponent,
  OpenIdComponent,
  SideDrawerMenuComponent,
  QuickSideDrawerMenuComponent
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
    ...COMPONENTS
  ]
})
export class NgComponentModule { }
