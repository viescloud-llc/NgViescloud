import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { MatFormFieldAppearance } from '@angular/material/form-field';
import { FixChangeDetection } from '../../directive/FixChangeDetection';
import { UtilsService } from '../../service/Utils.service';
import { RgbColor } from '../../model/Rgb.model';

@Component({
  selector: 'app-mat-form-field',
  templateUrl: './mat-form-field.component.html',
  styleUrls: ['./mat-form-field.component.scss']
})
export class MatFormFieldComponent extends FixChangeDetection implements OnInit, OnChanges {

  @Input()
  value: string | number | any = '';

  valueCopy: string | number | any = '';

  @Output()
  valueChange: EventEmitter<string | number | any> = new EventEmitter();

  @Output()
  onValueChange: EventEmitter<void> = new EventEmitter();

  @Output()
  onEnter: EventEmitter<void> = new EventEmitter();

  @Input()
  error: string = '';

  internalError = '';

  @Input()
  matColor: ThemePalette = 'primary';

  @Input()
  appearance: string = 'fill';

  @Input()
  label: string = '';

  @Input()
  placeholder: string = '';

  @Input()
  required: boolean = false;

  @Input()
  disable: boolean = false;

  @Input()
  fakeDisable: boolean = false;

  @Input()
  width: number = 40;

  @Input()
  styleWidth?: string;

  @Input()
  autoResize: boolean = false;

  defaultTextColor = 'black';
  
  //key capture
  keyDown: string[] = [];

  //dynamic type
  @Input()
  blankObject?: any;

  constructor() {
    super();
  }

  ngOnInit() {
    if((this.value === undefined || this.value === null) && this.blankObject) {
      this.value = structuredClone(this.blankObject);
      this.valueCopy = structuredClone(this.blankObject);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.valueCopy = structuredClone(this.value);
    if(!this.value && this.blankObject) {
      this.value = structuredClone(this.blankObject);
      this.valueCopy = structuredClone(this.blankObject);
    }
  }

  emitValue(): void {
    this.valueChange.emit(this.value);
    this.onValueChange.emit();
  }

  emitEnter(): void {
    this.onEnter.emit();
  }

  addKey(keybaordEvent: KeyboardEvent) {
    // console.log(keybaordEvent);
  }

  clear(): void {
    if (this.isValueNumber())
      this.value = 0;
    else
      this.value = '';
      
    this.valueChange.emit(this.value);
  }

  isValidInput(): boolean {
    if (this.required && !this.value)
      return false;

    if(this.internalError)
      return false;

    if (this.error)
      return false;

    return true;
  }

  getSize(data: string): number {
    let offset = 10;

    if (!this.autoResize)
      return this.width;

    if (data.length <= 10)
      return this.width;
    else
      return data.length + offset;
  }

  getAppearance(): MatFormFieldAppearance {
    let appearance: MatFormFieldAppearance = 'fill';
    switch (this.appearance.toLowerCase()) {
      case 'fill':
      case '1':
        appearance = 'fill'
        break;

      case 'outline':
      case '2':
        appearance = 'outline'
        break;

      default:
        break;
    }

    return appearance;
  }

  isValueChange(): boolean {
    return this.value !== this.valueCopy;
  }

  isValueNotChange(): boolean {
    return this.value === this.valueCopy;
  }

  isValueEnum(): boolean {
    return UtilsService.isEnum(this.value);
  }

  isValueString(): boolean {
    return typeof this.value === 'string';
  }

  isValueMultipleStringLine(): boolean {
    return typeof this.value === 'string' && this.value.includes("\n");
  }

  isValueNonMultipleStringLine(): boolean {
    return typeof this.value === 'string' && !this.value.includes("\n");
  }

  isValueNumber(): boolean {
    return typeof this.value === 'number';
  }

  isValueBoolean(): boolean {
    return typeof this.value === 'boolean';
  }

  resetValue(): void {
    this.value = structuredClone(this.valueCopy);
  }

  isValueArray(): boolean {
    return Array.isArray(this.value);
  }

  isValueObject(): boolean {
    return typeof this.value === 'object';
  }

  isValuePrimitive(): boolean {
    if(this.isValueArray() || this.isValueObject())
      return false;
    else
      return true;
  }

  isValueRgbColor(): boolean {
    return this.value instanceof RgbColor;
  }
}
