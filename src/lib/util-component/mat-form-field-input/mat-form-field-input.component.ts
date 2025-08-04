import { Component, EventEmitter, Input, Output, SimpleChanges, forwardRef } from '@angular/core';
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';
import { Observable, map, startWith } from 'rxjs';
import { FormControl, ValidatorFn, Validators } from '@angular/forms';

@Component({
  selector: 'app-mat-form-field-input',
  templateUrl: './mat-form-field-input.component.html',
  styleUrls: ['./mat-form-field-input.component.scss'],
  providers: [{ provide: MatFormFieldComponent, useExisting: forwardRef(() => MatFormFieldInputComponent) }],
  standalone: false
})
export class MatFormFieldInputComponent extends MatFormFieldComponent {
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

    this.formControl = new FormControl(this.value);

    this.addValidator();

    this.initFilteredOptions();
  }

  override ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    if (changes['options'] && this.filteredOptions) {
      this.initFilteredOptions();
    }
  }

  private initFilteredOptions() {
    this.filteredOptions = this.formControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
  }

  private addValidator() {
    if (this.disable)
      this.formControl.disable({ onlySelf: true });

    if (this.validateEmail)
      this.formControl.addValidators(Validators.email);

    if (this.max)
      this.formControl.addValidators(Validators.max(+this.max));

    if (this.min)
      this.formControl.addValidators(Validators.min(+this.min));

    if (this.maxlength)
      this.formControl.addValidators(Validators.maxLength(+this.maxlength));

    if (this.minlength)
      this.formControl.addValidators(Validators.minLength(+this.minlength));

    if(this.required)
      this.formControl.addValidators(Validators.required);
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
      this.value = this.focusOutAutoFillFn(this.value);
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
    if (this.defaultType === 'number')
      this.value = 0;
    else
      this.value = '';

    if (this.manuallyEmitValue)
      return;

    this.valueChange.emit(this.value);
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
    if(this.value && !this.value.startsWith('https://') && !this.value.startsWith('http://'))
      this.value = 'https://' + this.value;

    this.emitValue();
  }

  getCustomIconLabelColor() {
    if(this.customIconLabel && this.customIconLabel.toLowerCase().includes('remove'))
      return 'red';
    else
      return '';
  }
}
