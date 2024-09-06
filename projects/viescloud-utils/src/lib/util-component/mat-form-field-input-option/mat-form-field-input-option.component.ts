import { Component, EventEmitter, Input, OnInit, Output, forwardRef } from '@angular/core';
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';
import { MatOption } from '../../model/Mat.model';
import { MatSelectChange } from '@angular/material/select';
import { UtilsService } from '../../service/Utils.service';

@Component({
  selector: 'app-mat-form-field-input-option',
  templateUrl: './mat-form-field-input-option.component.html',
  styleUrls: ['./mat-form-field-input-option.component.scss'],
  providers: [{provide: MatFormFieldComponent, useExisting: forwardRef(() => MatFormFieldInputOptionComponent)}],
})
export class MatFormFieldInputOptionComponent<T> extends MatFormFieldComponent {

  @Input()
  options: MatOption<T>[] = [];

  @Input()
  noneLabel = 'None';

  @Output()
  opened: EventEmitter<void> = new EventEmitter();

  @Output()
  closed: EventEmitter<void> = new EventEmitter();

  @Output()
  selectionChange: EventEmitter<T> = new EventEmitter();

  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.populateOptions();
  }

  populateOptions() {
    this.options.forEach(e => {
      if(UtilsService.isEqual(e.value, this.value))
        e.value = this.value;
    })
  }

  emitOpened() {
    this.opened.emit();
  }

  emitClosed() {
    this.closed.emit();
  }

  emitSelectionChange(matSelectChange: MatSelectChange) {
    this.selectionChange.emit(matSelectChange.value);
  }

  override isValidInput(): boolean {
    if (this.required)
      return this.options.some(e => UtilsService.isEqual(e.value, this.value)) && super.isValidInput();
    else
      return true;
  }
}
