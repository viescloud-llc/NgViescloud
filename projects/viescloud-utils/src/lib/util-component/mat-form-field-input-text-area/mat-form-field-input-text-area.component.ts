import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, forwardRef, OnChanges, SimpleChanges } from '@angular/core';
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';

@Component({
  selector: 'app-mat-form-field-input-text-area',
  templateUrl: './mat-form-field-input-text-area.component.html',
  styleUrls: ['./mat-form-field-input-text-area.component.scss'],
  providers: [{provide: MatFormFieldComponent, useExisting: forwardRef(() => MatFormFieldInputTextAreaComponent)}],
})
export class MatFormFieldInputTextAreaComponent extends MatFormFieldComponent {

  @ViewChild('input')
  textarea?: ElementRef<HTMLTextAreaElement>;

  @Input()
  override value: string = '';

  override valueCopy: string = '';

  @Output()
  override valueChange: EventEmitter<string> = new EventEmitter();

  @Input()
  maxlength: string = '';

  @Input()
  rows: string = ''; // min height

  @Input()
  cols: string = ''; //min width

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

  @Input()
  showResizeVerticalButton: boolean = false;

  @Input()
  autoScrollToBottom: boolean = false;

  //input copy
  @Input()
  copyDisplayMessage: string = this.value.toString();

  override ngOnChanges(changes: SimpleChanges): void {
    if(changes['value'] && this.autoScrollToBottom) {
      this.scrollToBottom();
    }
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

  scrollToBottom(): void {
    if(this.textarea) {
      const textarea = this.textarea.nativeElement;
      textarea.scrollTop = textarea.scrollHeight;
    }
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
