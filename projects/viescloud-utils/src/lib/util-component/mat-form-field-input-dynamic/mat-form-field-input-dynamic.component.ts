import { Component, Input, SimpleChanges, forwardRef } from '@angular/core';
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';
import { MatFromFieldInputDynamicItem, MatItemSetting, MatItemSettingType, MatOption } from '../../model/Mat.model';
import { UtilsService } from '../../service/Utils.service';

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
}

@Component({
  selector: 'app-mat-form-field-input-dynamic',
  templateUrl: './mat-form-field-input-dynamic.component.html',
  styleUrls: ['./mat-form-field-input-dynamic.component.scss'],
  providers: [{ provide: MatFormFieldComponent, useExisting: forwardRef(() => MatFormFieldInputDynamicComponent) }],
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
  showListSizeInput: boolean = false;

  @Input()
  showListRemoveItemButton: boolean = true;

  @Input()
  showListAddItemButton: boolean = true;

  @Input()
  matOptions?: MatOption<any>[];

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

  //dynamic type
  @Input()
  objectLabel?: string;

  items: MatFromFieldInputDynamicItem[] = [];

  validInput: boolean = false;

  DynamicMatInputType = DynamicMatInputType;
  inputType: DynamicMatInputType = DynamicMatInputType.UNKOWN;

  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();

    if(!this.blankObject)
      this.blankObject = this.value;

    this.init();
  }

  override ngOnChanges(changes: SimpleChanges): void {
    super.ngOnChanges(changes);
    this.init();
  }

  init() {
    if(this.isValueObject() && this.blankObject && !this.isValueArray())
      this.parseItems();
    this.setInputType();
  }

  override isValidInput(): boolean {
    return this.validInput;
  }

  private setInputType() {
    if(this.isValueNumber())
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
    else if(this.isValueArray())
      this.inputType = DynamicMatInputType.ARRAY;
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
        item.key = key;
        item.value = this.getValue(key);
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

  private getValue(key: string) {
    let value = this.value[key];

    if(value)
      return value;

    else return this.getKeyBlankObject(key);
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
      let name = key + type;
      if (Object.hasOwn(prototype, name) && !!prototype[name])
        settings.push(new MatItemSetting(type));
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

  public containHide(item: MatFromFieldInputDynamicItem) {
    return item.containSetting(MatItemSettingType.HIDE);
  }

  public containRequire(item: MatFromFieldInputDynamicItem) {
    return item.containSetting(MatItemSettingType.REQUIRE);
  }

  public containDisable(item: MatFromFieldInputDynamicItem) {
    return item.containSetting(MatItemSettingType.DISABLE);
  }

  public containTextArea(item: MatFromFieldInputDynamicItem) {
    return item.containSetting(MatItemSettingType.TEXT_AREA);
  }

  public containValidateEmail(item: MatFromFieldInputDynamicItem) {
    return item.containSetting(MatItemSettingType.VALIDATE_EMAIL);
  }

  public containAutoFillHttps(item: MatFromFieldInputDynamicItem) {
    return item.containSetting(MatItemSettingType.AUTO_FILL_HTTPS);
  }

  public containListShowInputSize(item: MatFromFieldInputDynamicItem) {
    return item.containSetting(MatItemSettingType.LIST_SHOW_LIST_SIZE_INPUT);
  }

  public containListShowAddItemButton(item: MatFromFieldInputDynamicItem) {
    return item.containSetting(MatItemSettingType.LIST_SHOW_ADD_ITEM_BUTTON);
  }

  public containListShowRemoveItemButton(item: MatFromFieldInputDynamicItem) {
    return item.containSetting(MatItemSettingType.LIST_SHOW_REMOVE_ITEM_BUTTON);
  }

  public containOptions(item: MatFromFieldInputDynamicItem) {
    return item.containSetting(MatItemSettingType.OPTIONS);
  }

  override isValueMultipleStringLine(): boolean {
      return (super.isValueMultipleStringLine() || this.isTextArea) && !this.isOptions;
  }

  override isValueNonMultipleStringLine(): boolean {
    return (super.isValueNonMultipleStringLine() && !this.isTextArea) && !this.isOptions;
  }

  override isValueNumber(): boolean {
    return super.isValueNumber() && !this.isOptions;
  }
}