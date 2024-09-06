import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';

@Component({
  selector: 'app-mat-form-field-input-text-area',
  templateUrl: './mat-form-field-input-text-area.component.html',
  styleUrls: ['./mat-form-field-input-text-area.component.scss'],
  providers: [{provide: MatFormFieldComponent, useExisting: forwardRef(() => MatFormFieldInputTextAreaComponent)}],
})
export class MatFormFieldInputTextAreaComponent extends MatFormFieldComponent {

  @Input()
  override value: string = '';

  override valueCopy: string = '';

  @Output()
  override valueChange: EventEmitter<string> = new EventEmitter();

  @Input()
  maxlength: string = '';

  @Input()
  rows: string = '';

  @Input()
  cols: string = '';

  @Input()
  autoResizeHeight: boolean = true;

  @Input()
  showGoto: boolean = false;

  @Input()
  showClearIcon: boolean = true;

  @Input()
  showEnterIcon: boolean = false;

  @Input()
  showCopyToClipboard: boolean = false;

  @Input()
  showGenerateValue: boolean = false;

  @Input()
  alwayUppercase: boolean = false;

  @Input()
  alwayLowercase: boolean = false;

  @Input()
  manuallyEmitValue: boolean = false;

  //input copy
  @Input()
  copyDisplayMessage: string = this.value.toString();

  constructor() {
    super();
  }

  override emitValue(): void {
    let value = this.value;

    if (this.alwayLowercase && typeof value === 'string')
      value = value.toLowerCase();

    if (this.alwayUppercase && typeof value === 'string')
      value = value.toUpperCase();

    this.valueChange.emit(value);
    this.onValueChange.emit();
  }

  emitValueWithCondition(): void {
    if(this.manuallyEmitValue)
      return;

    this.emitValue();
  }

  override clear(): void {
    this.value = ''

    if(this.manuallyEmitValue)
      return;

    this.valueChange.emit(this.value);
  }

  override getSize(data: string): number {
    let offset = 10;
    if (this.showCopyToClipboard)
      offset += 5;
    if (this.showGenerateValue)
      offset += 5;
    if (this.showGoto)
      offset += 5;

    if (!this.autoResize)
      return this.width;

    if (data.length <= 10)
      return this.width;
    else
      return data.length + offset;
  }

  openLink(link: string): void {
    window.open(link);
  }
}
