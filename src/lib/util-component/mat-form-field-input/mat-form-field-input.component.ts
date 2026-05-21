import { Component, EventEmitter, Input, OnDestroy, Output, SimpleChanges, computed, forwardRef, input, signal } from '@angular/core';
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';
import { merge, Observable, Subject, Subscription, map, max, startWith } from 'rxjs';
import { FormControl, ValidatorFn, Validators } from '@angular/forms';
import { isMatOption, MatOption } from '../../model/mat.model';

@Component({
  selector: 'app-mat-form-field-input',
  templateUrl: './mat-form-field-input.component.html',
  styleUrls: ['./mat-form-field-input.component.scss'],
  providers: [{ provide: MatFormFieldComponent, useExisting: forwardRef(() => MatFormFieldInputComponent) }],
  standalone: false
})
export class MatFormFieldInputComponent<T> extends MatFormFieldComponent implements OnDestroy {
  
  declare value: T;
  declare valueCopy: T;

  options = input<T[] | MatOption<T>[]>([]);

  // mat option
  formControl!: FormControl;
  filteredOptions!: Observable<MatOption<T>[]>;
  private inputText$ = new Subject<string>();

  private valueChangesSubscription?: Subscription;
  private isUpdatingFromParent = signal(false);

  //custom icon
  @Output()
  onCustomIconClick: EventEmitter<any> = new EventEmitter();

  override ngOnInit(): void {
    super.ngOnInit();
    
    this.setInputValueIfEmpty(this.inputKeys.copyDisplayMessage, computed(() => {
      if(this.isValueString() || this.isValueNumber()) {
        return this.getValue().toString();
      }
      return '';
    }));

    this.formControl = new FormControl(this.getValue());

    this.addValidator();

    this.initFilteredOptions();

    // Subscribe to formControl value changes
    this.valueChangesSubscription = this.formControl.valueChanges.subscribe(value => {
      if (this.isUpdatingFromParent()) {
        return; // Prevent circular updates
      }

      // Update the internal value
      this.setValue(value);

      // Emit value if not in manual mode or after paste
      this.emitValueWithCondition();
    });
  }

  override ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);

    // Sync formControl value when input value changes from parent
    if (changes['value'] && this.formControl) {
      this.isUpdatingFromParent.set(true);
      const currentValue = this.getValue();
      if (this.formControl.value !== currentValue) {
        this.formControl.setValue(currentValue, { emitEvent: false });
      }
      this.isUpdatingFromParent.set(false);
    }

    if (changes['options'] && this.filteredOptions) {
      this.initFilteredOptions();
    }

    // Update validators if relevant inputs change
    if (changes['disable'] || changes['required'] || changes['validateEmail'] ||
        changes['min'] || changes['max'] || changes['minlength'] || changes['maxlength']) {
      this.updateValidators();
    }
  }

  private initFilteredOptions() {
    this.filteredOptions = merge(this.formControl.valueChanges, this.inputText$).pipe(
      startWith(this.formControl.value ?? ''),
      map(value => this._filter(value))
    );
  }

  onInputTyping(event: Event) {
    this.inputText$.next((event.target as HTMLInputElement).value);
  }

  private _filter(value: any): MatOption<T>[] {
    if(this.options().length === 0) {
      return [];
    }

    const filterValue = (value ?? '').toString().toLowerCase();

    return this.options().map(e => {
      if(isMatOption(e)) {
        return e as MatOption<T>;
      }
      else  {
        let valueLabel: string = "UNKOWN";
        if(typeof e === 'string' || typeof e === 'number') {
          valueLabel = e.toString();
        }

        let matOption: MatOption<T> = {
          value: e as T,
          valueLabel: valueLabel
        }
        return matOption;
      }
    })
    .filter(option => option.valueLabel.toLowerCase().includes(filterValue));
  }

  private addValidator() {
    this.updateValidators();
  }

  private updateValidators() {
    // Clear all validators first
    this.formControl.clearValidators();

    const validators: ValidatorFn[] = [];

    if (this.getInputValue(this.inputKeys.validateEmail)) {
      validators.push(Validators.email);
    }

    if (this.getInputValue(this.inputKeys.max)) {
      let max = this.getInputValue(this.inputKeys.max)!;
      if(max > 0) {
        validators.push(Validators.max(max));
      }
    }

    if (this.getInputValue(this.inputKeys.min)) {
      let min = this.getInputValue(this.inputKeys.min)!;
      if(min >= 0) {
        validators.push(Validators.min(min));
      }
    }

    if (this.getInputValue(this.inputKeys.maxlength)) {
      let maxlength = this.getInputValue(this.inputKeys.maxlength)!;
      if(maxlength > 0) {
        validators.push(Validators.maxLength(maxlength));
      }
    }

    if (this.getInputValue(this.inputKeys.minlength)) {
      let minlength = this.getInputValue(this.inputKeys.minlength)!;
      if(minlength > 0) {
        validators.push(Validators.minLength(minlength));
      }
    }

    if (this.getInputValue(this.inputKeys.required)) {
      validators.push(Validators.required);
    }

    // Set all validators at once
    if (validators.length > 0) {
      this.formControl.setValidators(validators);
    }

    // Update enabled/disabled state
    if (this.getInputValue(this.inputKeys.disable))
      this.formControl.disable({ onlySelf: true });
    else
      this.formControl.enable({ onlySelf: true });

    // Update validity
    this.formControl.updateValueAndValidity({ emitEvent: false });
  }

  getFormControlError(): string {
    let errors = this.formControl.errors;

    if(errors?.['email'])
      return `Email is not valid`;

    if(errors?.['max'])
      return `${this.getInputValue(this.inputKeys.label)} can not be bigger than ${this.getInputValue(this.inputKeys.max)}`;

    if(errors?.['min'])
      return `${this.getInputValue(this.inputKeys.label)} can not be smaller than ${this.getInputValue(this.inputKeys.min)}`;

    if(errors?.['maxLength'])
      return `${this.getInputValue(this.inputKeys.label)} can not be longer than ${this.getInputValue(this.inputKeys.maxlength)} length`;

    if(errors?.['minLength'])
      return `${this.getInputValue(this.inputKeys.label)} can not be shorter than ${this.getInputValue(this.inputKeys.minlength)} length`;

    if(errors?.['required'])
      return `${this.getInputValue(this.inputKeys.label)} can not be empty`;

    return '';
  }



  override emitValue(): void {
    let value = structuredClone(this.getValue());

    if (this.getInputValue(this.inputKeys.alwayLowercase) && typeof value === 'string')
      value = value.toLowerCase();

    if (this.getInputValue(this.inputKeys.alwayUppercase) && typeof value === 'string')
      value = value.toUpperCase();

    if (this.isValueNumber() && this.getInputValue(this.inputKeys.min) && +value < this.getInputValue(this.inputKeys.min)!) {
      value = this.getInputValue(this.inputKeys.min);
    }

    if (this.isValueNumber() && this.getInputValue(this.inputKeys.max) && +value > this.getInputValue(this.inputKeys.max)!) {
      value = this.getInputValue(this.inputKeys.max);
    }

    if(this.getInputValue(this.inputKeys.defaultType) === 'number' && !value) {
      this.valueChange.emit(0);
    }
    else {
      this.valueChange.emit(value);
    }

    this.onValueChange.emit();

  }

  focusoutEmitValue() {
    this.focusoutEmit();

    if(this.getInputValue(this.inputKeys.autoFillHttps)) {
      this.onAutoFillHttps();
      return;
    }

    if(this.getInputValue(this.inputKeys.focusOutAutoFillFn)) {
      const newValue = this.getInputValue(this.inputKeys.focusOutAutoFillFn)!(this.getValue());
      this.setValue(newValue);
      this.isUpdatingFromParent.set(true);
      this.formControl.setValue(newValue, { emitEvent: false });
      this.isUpdatingFromParent.set(false);
      this.emitValue();
      return;
    }

    if (this.getInputValue(this.inputKeys.onFocusoutEmitValueOnly)) {
      this.emitValue();
    }

  }

  emitCustomIcon() {
    this.emitValue();
    this.onCustomIconClick.emit(this.value);
  }

  override isValidInput(): boolean {
    if(this.getFormControlError())
      return false;

    if (this.getInputValue(this.inputKeys.required) && this.value === '')
      return false;

    if (this.exceedMax() || this.exceedMin())
      return false;

    if (this.getInputValue(this.inputKeys.error))
      return false;

    return true;
  }

  exceedMax(): boolean {
    if (this.isValueNumber() && this.getInputValue(this.inputKeys.max))
      return +this.value > this.getInputValue(this.inputKeys.max)!;

    return false;
  }

  exceedMin(): boolean {
    if (this.isValueNumber() && this.getInputValue(this.inputKeys.min))
      return +this.value < this.getInputValue(this.inputKeys.min)!;

    return false;
  }

  emitValueWithCondition(): void {
    if (this.getInputValue(this.inputKeys.manuallyEmitValue)) {
      return;
    }

    this.emitValue();
  }

  override clear(): void {
    const clearValue = this.getInputValue(this.inputKeys.defaultType) === 'number' ? 0 : '';

    this.setValue(clearValue);
    this.isUpdatingFromParent.set(true);
    this.formControl.setValue(clearValue, { emitEvent: false });
    this.isUpdatingFromParent.set(false);

    if (this.getInputValue(this.inputKeys.manuallyEmitValue)) {
      return;
    }

    this.valueChange.emit(clearValue);
    this.onValueChange.emit();
  }

  override getSize(data: string): number {
    let offset = 10;
    if (this.getInputValue(this.inputKeys.showCopyToClipboard)) {
      offset += 5;
    }
    if (this.getInputValue(this.inputKeys.showGenerateValue)) {
      offset += 5;
    }
    if (this.getInputValue(this.inputKeys.showGoto)) {
      offset += 5;
    }
    if (this.getInputValue(this.inputKeys.showVisibleSwitch)) {
      offset += 5;
    }

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

  override isValueNumber(): boolean {
    return this.getInputValue(this.inputKeys.defaultType) === 'number' || typeof this.value === 'number';
  }

  getInputValueHintColorNgStyle() {
    if(this.exceedMax() || this.exceedMin()) {
      return {
        color: this.getInputValue(this.inputKeys.defaultErrorTextColor)
      }
    }
    else
      return {}
  }

  onAutoFillHttps() {
    const currentValue = this.getValue();
    if(currentValue && !currentValue.startsWith('https://') && !currentValue.startsWith('http://')) {
      const newValue = 'https://' + currentValue;
      this.setValue(newValue);
      this.isUpdatingFromParent.set(true);
      this.formControl.setValue(newValue, { emitEvent: false });
      this.isUpdatingFromParent.set(false);
    }

    this.emitValue();
  }

  ngOnDestroy(): void {
    this.valueChangesSubscription?.unsubscribe();
  }

  getCustomIconLabelColor() {
    if(this.getInputValue(this.inputKeys.customIconLabel) && this.getInputValue(this.inputKeys.customIconLabel).toLowerCase().includes('remove'))
      return 'red';
    else
      return '';
  }

  getValueAsString() {
    if(this.isValueString()) {
      return this.getValue();
    }
    else if(this.isValueNumber()) {
      return this.getValue().toString();
    }
    else if(isMatOption(this.value)) {
      return this.value.valueLabel;
    }
    else {
      return '';
    }
  }
}
