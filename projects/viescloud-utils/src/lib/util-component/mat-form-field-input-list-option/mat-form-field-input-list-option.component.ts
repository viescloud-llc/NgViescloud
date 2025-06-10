import { Component, Input, forwardRef, OnInit, Output, EventEmitter } from '@angular/core';
import { MatFormFieldInputListComponent } from '../mat-form-field-input-list/mat-form-field-input-list.component';
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';
import { MatOption } from '../../model/mat.model';
import { UtilsService } from '../../service/utils.service';
import { DataUtils } from '../../util/Data.utils';
import { NumberUtils } from '../../util/Number.utils';

@Component({
  selector: 'app-mat-form-field-input-list-option',
  templateUrl: './mat-form-field-input-list-option.component.html',
  styleUrls: ['./mat-form-field-input-list-option.component.scss'],
  providers: [{provide: MatFormFieldComponent, useExisting: forwardRef(() => MatFormFieldInputListOptionComponent)}],
})
export class MatFormFieldInputListOptionComponent<T> extends MatFormFieldInputListComponent {

  @Input()
  options: MatOption<T>[] = [];

  @Input()
  uniqueValue: boolean = false;

  override ngOnInit(): void {
    super.ngOnInit();
    
    if(this.uniqueValue)
      this.maxSize = this.options.length;
  }

  override cloneBlankObject() {
    if(this.uniqueValue) {
      let index = this.options.findIndex(e => !e.disable);
      if(index !== -1)
        return structuredClone(this.options[index].value);
      else
        return structuredClone(this.options[0].value);
    }
    else 
      return structuredClone(this.options[NumberUtils.getRandomInteger(0, this.options.length - 1)].value);
  }

  getOptons() {

    if(this.uniqueValue) {
      this.options.forEach(e => {
        e.disable = this.value.some(f => DataUtils.isEqual(f, e.value));
      })
    }

    return this.options;
  }
}
