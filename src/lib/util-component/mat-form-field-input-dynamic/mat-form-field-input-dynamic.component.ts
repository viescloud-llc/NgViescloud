import { Component, Input, SimpleChanges, forwardRef } from '@angular/core';
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';
import { MatFromFieldInputDynamicItem, MatItemSetting, MatItemSettingType, MatOption } from '../../model/mat.model';
import { UtilsService } from '../../service/utils.service';
import { DataUtils } from '../../util/Data.utils';
import { ViesService } from '../../service/rest.service';

export enum DynamicMatInputType {
  UNKOWN = 'unkown',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  BOOLEAN_SLIDE_TOGGLE = 'booleanSlideToggle',
  OPTIONS = 'options',
  STRING = 'string',
  STRING_MULTIPLE_LINE = 'stringMultipleLine',
  ARRAY = 'array',
  OBJECT = 'object',
  DATE_TIME = 'dateTime',
  RGB_COLOR = 'rgbColor',
  RECORD = 'record'
}

@Component({
  selector: 'app-mat-form-field-input-dynamic',
  templateUrl: './mat-form-field-input-dynamic.component.html',
  styleUrls: ['./mat-form-field-input-dynamic.component.scss'],
  providers: [{ provide: MatFormFieldComponent, useExisting: forwardRef(() => MatFormFieldInputDynamicComponent) }],
  standalone: false
})
export class MatFormFieldInputDynamicComponent extends MatFormFieldComponent {

  @Input()
  isPassword: boolean = false;

  @Input()
  isEmail: boolean = false;

  @Input()
  isTextArea: boolean = false;

  @Input()
  isSlideToggle: boolean = false;

  @Input()
  isOptions: boolean = false;

  @Input()
  isHttps: boolean = false;

  @Input()
  isRecord: boolean = false;

  @Input()
  isBlankObjectArray: boolean = false;

  @Input()
  showGotoButton: boolean = false;

  @Input()
  showListSizeInput: boolean = false;

  @Input()
  showListRemoveItemButton: boolean = true;

  @Input()
  showListAddItemButton: boolean = true;

  @Input()
  listRequired: boolean = false;

  @Input()
  indent: boolean = true;

  @Input()
  matOptions?: MatOption<any>[];

  @Input()
  objectLabel?: string;

  @Input()
  selfRef?: MatFromFieldInputDynamicItem;

  // mat option
  options: MatOption<any>[] = [
    {
      value: true,
      valueLabel: "TRUE"
    },
    {
      value: false,
      valueLabel: "FALSE"
    }
  ];

  items: MatFromFieldInputDynamicItem[] = [];

  validInput: boolean = false;

  DynamicMatInputType = DynamicMatInputType;
  inputType: DynamicMatInputType = DynamicMatInputType.UNKOWN;

  initBlankObjectProvided: boolean = true;

  MatItemSettingType = MatItemSettingType;

  override ngOnInit() {
    if(ViesService.isNotCSR()) {
      return;
    }

    super.ngOnInit();

    if(this.blankObject === undefined || this.blankObject === null) {
      this.blankObject = structuredClone(this.value);
      this.initBlankObjectProvided = false;
    }

    this.init();
  }

  override ngOnChanges(changes: SimpleChanges): void {
    if(ViesService.isNotCSR()) {
      return;
    }

    super.ngOnChanges(changes);

    if(changes['value'] && !this.initBlankObjectProvided) {
      this.blankObject = structuredClone(this.value);
    }

    this.init();
  }

  init() {
    if(this.isValueObject() && this.blankObject && !this.isValueArray()) {
      this.parseItems();
    }

    this.loadSelfRefSetting();
    this.setInputType();
  }

  override isValidInput(): boolean {
    return this.validInput;
  }

  private loadSelfRefSetting() {
    if(this.selfRef) {

    }
  }

  private setInputType() {
    if(this.isValueArray())
      this.inputType = DynamicMatInputType.ARRAY;
    else if(this.isValueRecord())
      this.inputType = DynamicMatInputType.RECORD;
    else if(this.isValueNumber())
      this.inputType = DynamicMatInputType.NUMBER;
    else if(this.isValueBoolean() && !this.isSlideToggle)
      this.inputType = DynamicMatInputType.BOOLEAN;
    else if(this.isValueBoolean() && this.isSlideToggle)
      this.inputType = DynamicMatInputType.BOOLEAN_SLIDE_TOGGLE;
    else if(this.isOptions)
      this.inputType = DynamicMatInputType.OPTIONS;
    else if(this.isValueNonMultipleStringLine())
      this.inputType = DynamicMatInputType.STRING;
    else if(this.isValueMultipleStringLine())
      this.inputType = DynamicMatInputType.STRING_MULTIPLE_LINE;
    else if(this.isValueRgbColor())
      this.inputType = DynamicMatInputType.RGB_COLOR;
    else if(this.isValueObject() && !this.isValueArray())
      this.inputType = DynamicMatInputType.OBJECT;
    else
      this.inputType = DynamicMatInputType.UNKOWN;
  }

  //dynamic object
  parseItems () {
    this.items = [];
    let defaultIndex = 100;

    //check if value is null or undefine
    if(!this.value) {
      this.value = structuredClone(this.blankObject);
      Object.setPrototypeOf(this.value , this.blankObject);
    }

    for (const [key] of Object.entries(this.blankObject)) {
      if(!this.getHideSettingValue(key)) {
        let item = new MatFromFieldInputDynamicItem();
        item.ref = this.value;
        item.blankObject = this.getKeyBlankObject(key);
        item.isBlankObjectArray = Array.isArray(this.blankObject[key]);
        item.key = key;
        item.value = this.getKeyValue(key);
        item.settings = this.getSettings(key);
        item.index = this.getIndexSettingValue(key, defaultIndex);
        item.label = this.getLabelSettingValue(key);
        item.placeholder = this.getPlaceholderSettingValue(key);
        item.matOptions = this.getMatOptions(key);
        this.items.push(item);
      }
      defaultIndex++;
    }
    this.items = this.items.sort((a, b) => a.index! - b.index!);
  }

  private getKeyBlankObject(key: string) {
    let blankObj = this.blankObject[key];
    if(Array.isArray(blankObj)) {
      if(blankObj.length > 0)
        return blankObj[0];
      else
        throw new Error("blank object array type can't define\nPlease add and empty element to array inside object field")
    }
    else
      return blankObj;
  }

  private getKeyValue(key: string) {
    let value = this.value[key];

    if(typeof value === 'boolean')
      return value;

    if(value)
      return value;
    else
      return this.getKeyBlankObject(key);
  }

  private getSettingValue(key: string, type: MatItemSettingType, defaultValue?: any): any {
    let prototype = Object.getPrototypeOf(this.blankObject!);
    let name = key + type.toString();
    if (Object.hasOwn(prototype, name))
      return prototype[name];
    else
      return defaultValue ?? key;
  }

  private getIndexSettingValue(key: string, defaultIndex: number): number {
    return this.getSettingValue(key, MatItemSettingType.INDEX, defaultIndex);
  }

  private getLabelSettingValue(key: string): string {
    return this.getSettingValue(key, MatItemSettingType.CUSTOM_LABEL);
  }

  private getPlaceholderSettingValue(key: string): string {
    return this.getSettingValue(key, MatItemSettingType.CUSTOM_PLACEHOLDER, '');
  }

  private getMatOptions(key: string): MatOption<any>[] {
    return this.getSettingValue(key, MatItemSettingType.OPTIONS, []);
  }

  private getSettings(key: string): MatItemSetting[] {
    let prototype = Object.getPrototypeOf(this.blankObject!);
    let settings: MatItemSetting[] = [];
    for(let type in MatItemSettingType) {
      let typeName = MatItemSettingType[type];
      let name = key + typeName;
      if (Object.hasOwn(prototype, name) && !!prototype[name]) {
        settings.push(new MatItemSetting(typeName));
      }
    }

    return settings;
  }

  public getTextAreaSettingValue(key: string): boolean {
    if(this.isTextArea)
      return true;

    let prototype = Object.getPrototypeOf(this.blankObject!);
    let name = key + MatItemSettingType.TEXT_AREA.toString();
    return Object.hasOwn(prototype, name) && !!prototype[name];
  }

  private getHideSettingValue(key: string): boolean {
    let prototype = Object.getPrototypeOf(this.blankObject!);
    let name = key + MatItemSettingType.HIDE.toString();
    return Object.hasOwn(prototype, name) && !!prototype[name];
  }

  public containSetting(item: MatFromFieldInputDynamicItem, matItemSettingType: MatItemSettingType) {
    return item.containSetting(matItemSettingType);
  }

  override isValueMultipleStringLine(): boolean {
      return (super.isValueMultipleStringLine() || this.isTextArea) && !this.isOptions;
  }

  override isValueNonMultipleStringLine(): boolean {
    return (super.isValueNonMultipleStringLine() && !this.isTextArea) && !this.isOptions;
  }

  override isValueNumber(): boolean {
    if(this.blankObject)
      return typeof this.blankObject === 'number' && !this.isOptions;
    else
      return super.isValueNumber() && !this.isOptions;
  }

  override isValueArray(): boolean {
    return this.isBlankObjectArray || super.isValueArray();
  }

  isValueRecord(): boolean {
    return this.isRecord;
  }

  onValueChangeFn() {
    this.onValueChange.emit();
  }
}
