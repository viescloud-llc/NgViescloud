import { Component, EventEmitter, forwardRef, Input, OnInit, Output } from '@angular/core';
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';
import { MatOption } from '../../model/Mat.model';
import { RgbColor, SampleRgbOptions } from '../../model/Rgb.model';

@Component({
  selector: 'app-mat-form-field-input-rgb-color-picker',
  templateUrl: './mat-form-field-input-rgb-color-picker.component.html',
  styleUrls: ['./mat-form-field-input-rgb-color-picker.component.scss'],
  providers: [{provide: MatFormFieldComponent, useExisting: forwardRef(() => MatFormFieldInputRgbColorPickerComponent)}],
})
export class MatFormFieldInputRgbColorPickerComponent extends MatFormFieldComponent {

  @Input()
  override value!: RgbColor;

  @Output()
  override valueChange: EventEmitter<RgbColor> = new EventEmitter<RgbColor>;

  sampleOptions: MatOption<RgbColor>[] = [];

  validForm: boolean = false;

  constructor() {
    super();
  }

  override ngOnInit(): void {
    let matOption: MatOption<RgbColor> = {
      value: {
        name: 'Custom',
        r: 0,
        g: 0,
        b: 0
      },
      valueLabel: 'Custom rgb color'
    }
    this.sampleOptions.push(matOption);
    
    SampleRgbOptions.forEach(e => {
      let matOption: MatOption<RgbColor> = {
        value: e,
        valueLabel: e.name
      }
      this.sampleOptions.push(matOption);
    })
  }

  getNgStyle() {
    return {
      'background-color': 'rgb(' + this.value.r + ',' + this.value.g + ',' + this.value.b + ')'
    }
  }

  override isValidInput(): boolean {
    let superCheck = super.isValidInput();
    if(!superCheck)
      return superCheck;
    else
      return this.validForm;
  }
}
