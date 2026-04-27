import { AfterContentChecked, ChangeDetectorRef, Component, DoCheck, EventEmitter, inject, input, Input, isSignal, linkedSignal, OnChanges, OnInit, Output, Signal, signal, SimpleChanges } from '@angular/core';
import { MatFormFieldAppearance } from '@angular/material/form-field';
import { UtilsService } from '../../service/utils.service';
import { RgbColor } from '../../model/rgb.model';
import { DialogUtils } from '../../util/Dialog.utils';
import { DataUtils } from '../../util/Data.utils';
import { ViesService } from '../../service/rest.service';
import { MatFormFields, MatFormFieldTypeMap } from '../../model/mat.model';
import { ViesMatFormFieldMap } from '../../abtract/ViesMatFormFieldMap';

@Component({
  selector: 'app-mat-form-field',
  templateUrl: './mat-form-field.component.html',
  styleUrls: ['./mat-form-field.component.scss'],
  standalone: false
})
export class MatFormFieldComponent extends ViesMatFormFieldMap implements OnInit, OnChanges, AfterContentChecked, DoCheck {

  @Input()
  value: string | number | any = '';

  valueCopy: string | number | any = '';

  @Output()
  valueChange: EventEmitter<string | number | any> = new EventEmitter();

  @Output()
  onValueChange: EventEmitter<void> = new EventEmitter();

  @Input()
  inputMap = new MatFormFields().addInputDefault();
  
  @Input()
  outputMap = new MatFormFields().addOutputDefault();

  @Output()
  onEnter: EventEmitter<void> = new EventEmitter();

  internalError = '';

  @Output()
  onFocusout: EventEmitter<void> = new EventEmitter();

  @Output()
  onFocus: EventEmitter<void> = new EventEmitter();

  //key capture
  keyDown: string[] = [];

  //dynamic type
  @Input()
  blankObject?: any;
  blankObjectType = signal<string>('');

  isFocus = false;

  cd = inject(ChangeDetectorRef);
  dialogUtils = inject(DialogUtils);

  ngDoCheck(): void {
    if(DataUtils.isNotEqual(this.getValue(), this.getValueCopy())) {
      this.ngOnChanges({});
    }
  }

  ngAfterContentChecked(): void {
    this.cd.detectChanges();
  }

  ngOnInit() {
    if(ViesService.isNotCSR()) {
      return;
    }

    if((this.getValue() === undefined || this.getValue() === null) && this.blankObject !== undefined && this.blankObject !== null) {
      this.setValue(structuredClone(this.blankObject));
      this.setValueCopy(structuredClone(this.blankObject));
    }

    this.updateBlankObjectType();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(ViesService.isNotCSR()) {
      return;
    }

    if(changes['value']) {
      this.setValueCopy(structuredClone(this.getValue()));
      this.ngOnInit();
    }
  }

  getValue() {
    return DataUtils.getAnyValue(this.value);
  }

  setValue(value: any) {
    DataUtils.setAnyValue(this.value, value, () => this.value = value);
  }

  getValueCopy() {
    return DataUtils.getAnyValue(this.valueCopy);
  }

  setValueCopy(value: any) {
    DataUtils.setAnyValue(this.valueCopy, value, () => this.value = value);
  }

  getInputValue<K extends keyof MatFormFieldTypeMap>(key: K) {
    return this.inputMap.getValue(key);
  }

  setInputValue<K extends keyof MatFormFieldTypeMap>(key: K, value: MatFormFieldTypeMap[K] | Signal<MatFormFieldTypeMap[K]>) {
    this.inputMap.set(key, value);
  }

  setInputValueIfEmpty<K extends keyof MatFormFieldTypeMap>(key: K, value: MatFormFieldTypeMap[K] | Signal<MatFormFieldTypeMap[K]>) {
    this.inputMap.setIfEmpty(key, value);
  }

  increaseInputValue<K extends keyof MatFormFieldTypeMap>(key: K) {
    return this.inputMap.increaseValue(key);
  }

  decreaseInputValue<K extends keyof MatFormFieldTypeMap>(key: K) {
    return this.inputMap.decreaseValue(key);
  }

  emitValue(value?: any): void {
    if(value) {
      this.setValue(value);
    }

    // For signals, emit the signal itself (not the unwrapped value) to preserve the reference
    // This allows two-way binding [(value)]="signal" to work correctly
    if(isSignal(this.value)) {
      this.valueChange.emit(this.value);
    } else {
      this.valueChange.emit(this.getValue());
    }
    this.onValueChange.emit();
  }

  emitEnter(): void {
    this.onEnter.emit();
  }

  addKey(keybaordEvent: KeyboardEvent) {
    // console.log(keybaordEvent);
  }

  clear(): void {
    if (this.isValueNumber()) {
      this.setValue(0);
    }
    else {
      this.setValue('');
    }

    this.valueChange.emit(this.getValue());
  }

  isValidInput(): boolean {
    if (this.getInputValue(this.inputKeys.required) && !this.getValue())
      return false;

    if(this.internalError)
      return false;

    if (this.getInputValue(this.inputKeys.error))
      return false;

    return true;
  }

  getSize(data: string): number {
    let offset = 10;

    if (!this.getInputValue(this.inputKeys.autoResize))
      return this.getInputValue(this.inputKeys.width);

    if (data.length <= 10)
      return this.getInputValue(this.inputKeys.width);
    else
      return data.length + offset;
  }

  getAppearance(): MatFormFieldAppearance {
    let appearance: MatFormFieldAppearance = 'fill';
    switch (this.getInputValue(this.inputKeys.appearance).toLowerCase()) {
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
    return DataUtils.isNotEqual(this.getValue(), this.getValueCopy());
  }

  isValueNotChange(): boolean {
    return DataUtils.isEqual(this.getValue(), this.getValueCopy());
  }

  isValueEnum(): boolean {
    return UtilsService.isEnum(this.getValue());
  }

  isValueString(): boolean {
    return typeof this.getValue() === 'string';
  }

  isValueMultipleStringLine(): boolean {
    return typeof this.getValue() === 'string' && this.getValue().includes("\n");
  }

  isValueNonMultipleStringLine(): boolean {
    return typeof this.getValue() === 'string' && !this.getValue().includes("\n");
  }

  isValueNumber(): boolean {
    return typeof this.getValue() === 'number';
  }

  isValueBoolean(): boolean {
    return typeof this.getValue() === 'boolean';
  }

  resetValue(): void {
    this.setValue(structuredClone(this.getValueCopy()));
  }

  isValueArray(): boolean {
    return Array.isArray(this.getValue()) || Array.isArray(this.blankObject);
  }

  isValueObject(): boolean {
    return typeof this.getValue() === 'object';
  }

  isValuePrimitive(): boolean {
    if(this.isValueArray() || this.isValueObject())
      return false;
    else
      return true;
  }

  isValueRgbColor(): boolean {
    return this.getValue() instanceof RgbColor || (this.blankObject && this.blankObject instanceof RgbColor);
  }

  getInputValueColorNgStyle() {
    if(this.getInputValue(this.inputKeys.error)) {
      return {
        color: this.getInputValue(this.inputKeys.defaultErrorTextColor)
      }
    }
    else
     return {};
  }

  updateBlankObjectType() {
    if(Array.isArray(this.blankObject)) {
      if(this.blankObject.length > 0)
        this.blankObject = this.blankObject[0];
      this.blankObjectType.set(typeof this.blankObject);
    }
    else if(typeof this.blankObject === 'object') {
      this.blankObjectType.set('object');
    }
    else {
      this.blankObjectType.set(typeof this.blankObject);
    }

    return this.blankObjectType();
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  isCSR() {
    return ViesService.isCSR();
  }

  isNotCSR() {
    return ViesService.isNotCSR();
  }

  focusoutEmit() {
    this.isFocus = false;
    this.onFocusout.emit();
  }

  focusEmit() {
    this.isFocus = true;
    this.onFocus.emit();
  }

  printValue() {
    console.log(this.getValue());
  }
}