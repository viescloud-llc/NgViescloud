import { Component, Input, forwardRef } from '@angular/core';
import { MatFormFieldInputListComponent } from '../mat-form-field-input-list/mat-form-field-input-list.component';
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';
import { MatOption } from '../../model/Mat.model';
import { UtilsService } from '../../service/Utils.service';

@Component({
  selector: 'app-mat-form-field-input-list-option',
  templateUrl: './mat-form-field-input-list-option.component.html',
  styleUrls: ['./mat-form-field-input-list-option.component.scss'],
  providers: [{provide: MatFormFieldComponent, useExisting: forwardRef(() => MatFormFieldInputListOptionComponent)}],
})
export class MatFormFieldInputListOptionComponent extends MatFormFieldInputListComponent {
  
  @Input()
  options: MatOption<any>[] = [];

  override cloneBlankObject() {
    return structuredClone(this.options[UtilsService.getRandomInt(this.options.length)].value);
  }
}
