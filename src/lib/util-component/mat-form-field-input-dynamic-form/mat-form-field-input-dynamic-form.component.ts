import { Component, computed, EventEmitter, forwardRef, inject, Inject, Input, input, OnInit, signal } from '@angular/core';
import { NgComponentModule } from "../../module/ng-component.module";
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';
import { ValueTracking } from '../../abtract/valueTracking.directive';
import { ViesForm } from '../../model/vies.model';
import { MatFormFieldFormComponent } from '../mat-form-field-form/mat-form-field-form.component';
import { MatFormFieldInputDynamicComponent } from '../mat-form-field-input-dynamic/mat-form-field-input-dynamic.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { runInThisContext } from 'vm';

@Component({
  selector: 'app-mat-form-field-input-dynamic-form',
  templateUrl: './mat-form-field-input-dynamic-form.component.html',
  styleUrls: ['./mat-form-field-input-dynamic-form.component.scss'],
  providers: [{ provide: MatFormFieldFormComponent, useExisting: forwardRef(() => MatFormFieldInputDynamicFormComponent) }],
  standalone: false
})
export class MatFormFieldInputDynamicFormComponent extends MatFormFieldFormComponent {

  validInput = signal<boolean>(false);

  hideRevertButton = input<boolean>(false);
  hideRemoveButton = input<boolean>(false);
  indent = input<boolean>(false);
}
