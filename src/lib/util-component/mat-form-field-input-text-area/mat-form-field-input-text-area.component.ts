import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, forwardRef, OnChanges, SimpleChanges, computed } from '@angular/core';
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';

@Component({
  selector: 'app-mat-form-field-input-text-area',
  templateUrl: './mat-form-field-input-text-area.component.html',
  styleUrls: ['./mat-form-field-input-text-area.component.scss'],
  providers: [{provide: MatFormFieldComponent, useExisting: forwardRef(() => MatFormFieldInputTextAreaComponent)}],
  standalone: false
})
export class MatFormFieldInputTextAreaComponent extends MatFormFieldComponent {

  @ViewChild('input')
  textarea?: ElementRef<HTMLTextAreaElement>;

  @Input()
  override value: string = '';

  override valueCopy: string = '';

  @Output()
  override valueChange: EventEmitter<string> = new EventEmitter();

  override ngOnInit(): void {
    super.ngOnInit();
    this.setInputValueIfEmpty(this.inputKeys.copyDisplayMessage, computed(() => this.value.toString()));
  }

  override ngOnChanges(changes: SimpleChanges): void {
    if(changes['value'] && this.getInputValue(this.inputKeys.autoScrollToBottom)) {
      this.scrollToBottom();
    }
  }

  override emitValue(): void {
    let value = this.value;

    if (this.getInputValue(this.inputKeys.alwayLowercase) && typeof value === 'string')
      value = value.toLowerCase();

    if (this.getInputValue(this.inputKeys.alwayUppercase) && typeof value === 'string')
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
    if(this.getInputValue(this.inputKeys.manuallyEmitValue))
      return;

    this.emitValue();
  }

  override clear(): void {
    this.value = ''

    if(this.getInputValue(this.inputKeys.manuallyEmitValue))
      return;

    this.valueChange.emit(this.value);
  }

  override getSize(data: string): number {
    let offset = 10;
    if (this.getInputValue(this.inputKeys.showCopyToClipboard))
      offset += 5;
    if (this.getInputValue(this.inputKeys.showGenerateValue))
      offset += 5;
    if (this.getInputValue(this.inputKeys.showGoto))
      offset += 5;

    if (!this.getInputValue(this.inputKeys.autoResize))
      return this.getInputValue(this.inputKeys.width);

    if (data.length <= 10)
      return this.getInputValue(this.inputKeys.width);
    else
      return data.length + offset;
  }

  openLink(link: string): void {
    window.open(link);
  }
}
