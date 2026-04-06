import { Component, EventEmitter, Input, OnDestroy, Output, SimpleChanges, forwardRef, signal } from '@angular/core';
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';
import { Observable, Subscription, map, startWith } from 'rxjs';
import { FormControl, ValidatorFn, Validators } from '@angular/forms';

@Component({
  selector: 'app-mat-form-field-input',
  templateUrl: './mat-form-field-input.component.html',
  styleUrls: ['./mat-form-field-input.component.scss'],
  providers: [{ provide: MatFormFieldComponent, useExisting: forwardRef(() => MatFormFieldInputComponent) }],
  standalone: false
})
export class MatFormFieldInputComponent extends MatFormFieldComponent implements OnDestroy {
  @Input()
  options: string[] = [];

  @Input()
  maxlength: string = '';

  @Input()
  minlength: string = '';

  @Input()
  showGoto: boolean = false;

  @Input()
  showClearIcon: boolean = true;

  @Input()
  showVisibleSwitch: boolean = false;

  @Input()
  showCopyToClipboard: boolean = false;

  @Input()
  showGenerateValue: boolean = false;

  @Input()
  showMinMaxHint: boolean = false;

  @Input()
  alwayUppercase: boolean = false;

  @Input()
  alwayLowercase: boolean = false;

  @Input()
  manuallyEmitValue: boolean = false;

  @Input()
  onFocusoutEmitValueOnly: boolean = true;

  //input copy
  @Input()
  copyDisplayMessage: string = this.value.toString();

  //switch
  @Input()
  switchVisibility: boolean = false;

  @Input()
  defaultType: string = 'text';

  @Input()
  switchType: string = 'password';

  @Input()
  onIcon: string = 'visibility';

  @Input()
  offIcon: string = 'visibility_off';

  @Input()
  manuallyEmitValueHint: string = 'Press apply icon or enter to apply input';

  @Input()
  customIconHint: string = '';

  //case of number

  @Input()
  min: string = '';

  @Input()
  max: string = '';

  // mat option
  formControl!: FormControl;
  filteredOptions!: Observable<string[]>;

  private valueChangesSubscription?: Subscription;
  private isUpdatingFromParent = signal(false);

  //custom icon
  @Output()
  onCustomIconClick: EventEmitter<any> = new EventEmitter();

  @Input()
  customIconLabel: string = '';

  //validator
  @Input()
  validateEmail: boolean = false;

  //auto fill
  @Input()
  autoFillHttps: boolean = false;

  @Input()
  focusOutAutoFillFn?: (value: any) => any;

  override ngOnInit(): void {
    super.ngOnInit();

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
    this.filteredOptions = this.formControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
  }

  private addValidator() {
    this.updateValidators();
  }

  private updateValidators() {
    // Clear all validators first
    this.formControl.clearValidators();

    const validators: ValidatorFn[] = [];

    if (this.validateEmail)
      validators.push(Validators.email);

    if (this.max)
      validators.push(Validators.max(+this.max));

    if (this.min)
      validators.push(Validators.min(+this.min));

    if (this.maxlength)
      validators.push(Validators.maxLength(+this.maxlength));

    if (this.minlength)
      validators.push(Validators.minLength(+this.minlength));

    if (this.required)
      validators.push(Validators.required);

    // Set all validators at once
    if (validators.length > 0) {
      this.formControl.setValidators(validators);
    }

    // Update enabled/disabled state
    if (this.disable)
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
      return `${this.label} can not be bigger than ${this.max}`;

    if(errors?.['min'])
      return `${this.label} can not be smaller than ${this.min}`;

    if(errors?.['maxLength'])
      return `${this.label} can not be longer than ${this.maxlength} length`;

    if(errors?.['minLength'])
      return `${this.label} can not be shorter than ${this.minlength} length`;

    if(errors?.['required'])
      return `${this.label} can not be empty`;

    return '';
  }

  private _filter(value: any): string[] {
    let filterValue = value;

    if (typeof filterValue === 'string')
      filterValue = value.toLowerCase();

    return this.options.filter(option => option.toLowerCase().includes(filterValue));
  }

  override emitValue(): void {
    let value = structuredClone(this.value);

    if (this.alwayLowercase && typeof value === 'string')
      value = value.toLowerCase();

    if (this.alwayUppercase && typeof value === 'string')
      value = value.toUpperCase();

    if (this.isValueNumber() && this.min && +value < +this.min)
      value = +this.min;

    if (this.isValueNumber() && this.max && +value > +this.max)
      value = +this.max;

    if(this.defaultType === 'number' && !value)
      this.valueChange.emit(0);
    else
      this.valueChange.emit(value);

    this.onValueChange.emit();

  }

  focusoutEmitValue() {
    this.focusoutEmit();

    if(this.autoFillHttps) {
      this.onAutoFillHttps();
      return;
    }

    if(this.focusOutAutoFillFn) {
      const newValue = this.focusOutAutoFillFn(this.getValue());
      this.setValue(newValue);
      this.isUpdatingFromParent.set(true);
      this.formControl.setValue(newValue, { emitEvent: false });
      this.isUpdatingFromParent.set(false);
      this.emitValue();
      return;
    }

    if (this.onFocusoutEmitValueOnly) {
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

    if (this.required && this.value === '')
      return false;

    if (this.exceedMax() || this.exceedMin())
      return false;

    if (this.error)
      return false;

    return true;
  }

  exceedMax(): boolean {
    if (this.isValueNumber() && this.max)
      return +this.value > +this.max;

    return false;
  }

  exceedMin(): boolean {
    if (this.isValueNumber() && this.min)
      return +this.value < +this.min;

    return false;
  }

  emitValueWithCondition(): void {
    if (this.manuallyEmitValue)
      return;

    this.emitValue();
  }

  override clear(): void {
    const clearValue = this.defaultType === 'number' ? 0 : '';

    this.setValue(clearValue);
    this.isUpdatingFromParent.set(true);
    this.formControl.setValue(clearValue, { emitEvent: false });
    this.isUpdatingFromParent.set(false);

    if (this.manuallyEmitValue)
      return;

    this.valueChange.emit(clearValue);
    this.onValueChange.emit();
  }

  override getSize(data: string): number {
    let offset = 10;
    if (this.showCopyToClipboard)
      offset += 5;
    if (this.showGenerateValue)
      offset += 5;
    if (this.showGoto)
      offset += 5;
    if (this.showVisibleSwitch)
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

  override isValueNumber(): boolean {
    return this.defaultType === 'number' || typeof this.value === 'number';
  }

  getInputHintColorNgStyle() {
    if(this.exceedMax() || this.exceedMin()) {
      return {
        color: this.defaultErrorTextColor
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
    if(this.customIconLabel && this.customIconLabel.toLowerCase().includes('remove'))
      return 'red';
    else
      return '';
  }
}
