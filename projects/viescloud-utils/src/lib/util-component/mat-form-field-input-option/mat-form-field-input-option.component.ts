import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges, forwardRef } from '@angular/core';
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';
import { MatOption } from '../../model/mat.model';
import { MatSelectChange } from '@angular/material/select';
import { UtilsService } from '../../service/utils.service';
import { DataUtils } from '../../util/Data.utils';

@Component({
  selector: 'app-mat-form-field-input-option',
  templateUrl: './mat-form-field-input-option.component.html',
  styleUrls: ['./mat-form-field-input-option.component.scss'],
  providers: [{provide: MatFormFieldComponent, useExisting: forwardRef(() => MatFormFieldInputOptionComponent)}],
  standalone: false
})
export class MatFormFieldInputOptionComponent<T> extends MatFormFieldComponent {

  @Input()
  options: MatOption<T>[] = [];

  @Input()
  noneLabel = 'None';

  @Input()
  customOptionLabel = '';

  @Input()
  customOptionLabelColor = '';

  @Input()
  noneLabelValue: T | undefined = this.blankObject;

  @Input()
  matchByFn: (value1: T, value2: T) => boolean = (value1: T, value2: T) => DataUtils.isEqual(value1, value2);

  @Output()
  opened: EventEmitter<void> = new EventEmitter();

  @Output()
  closed: EventEmitter<void> = new EventEmitter();

  @Output()
  selectionChange: EventEmitter<T> = new EventEmitter();

  @Output()
  onCustomOptionSelected: EventEmitter<void> = new EventEmitter();

  override ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    if (changes['options'] && this.options || changes['value']) {
      this.populateOptions();
    }
  }

  override ngOnInit() {
    super.ngOnInit();
    this.populateOptions();
  }

  populateOptions() {
    this.options.forEach(e => {
      if(this.matchByFn(this.value, e.value)) {
        e.value = this.value;
      }
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
      return this.options.some(e => DataUtils.isEqual(e.value, this.value)) && super.isValidInput();
    else
      return true;
  }
}
