import { Component, forwardRef, input, linkedSignal, signal } from '@angular/core';
import { MatFormFieldFormComponent } from '../mat-form-field-form/mat-form-field-form.component';

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
  _hideRevertButton = linkedSignal(() => this.hideRevertButton());

  hideRemoveButton = input<boolean>(false);
  _hideRemoveButton = linkedSignal(() => this.hideRemoveButton());

  indent = input<boolean>(false);
  _indent = linkedSignal(() => this.indent());
}
