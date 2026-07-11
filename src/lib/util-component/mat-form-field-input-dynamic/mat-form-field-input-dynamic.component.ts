import { Component, Input, SimpleChanges, forwardRef } from '@angular/core';
import { MatFormFieldComponent } from '../mat-form-field/mat-form-field.component';
import { MatFormFieldInputKeys, MatFormFieldTypeMap, MatFromFieldInputDynamicItem, MatItemSetting, MatItemSettingType, MatOption } from '../../model/mat.model';
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
      this.blankObject = structuredClone(this.getValue());
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
      this.blankObject = structuredClone(this.getValue());
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
    else if(this.isValueBoolean() && !this.getInputValue(this.inputKeys.isSlideToggle))
      this.inputType = DynamicMatInputType.BOOLEAN;
    else if(this.isValueBoolean() && this.getInputValue(this.inputKeys.isSlideToggle))
      this.inputType = DynamicMatInputType.BOOLEAN_SLIDE_TOGGLE;
    else if(this.getInputValue(this.inputKeys.isOptions))
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
    if(!this.getValue()) {
      this.setValue(structuredClone(this.blankObject));
      Object.setPrototypeOf(this.getValue() , this.blankObject);
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
        item.matOptions = this.getMatOptions(key);

        item.inputMap = this.inputMap.clone();

        item.inputMap.set(this.inputKeys.label, this.getLabelSettingValue(key));
        item.inputMap.set(this.inputKeys.placeholder, this.getPlaceholderSettingValue(key));
        item.inputMap.set(this.inputKeys.matOptions, item.matOptions);
        item.inputMap.set(this.inputKeys.isBlankObjectArray, item.isBlankObjectArray);
        item.inputMap.set(this.inputKeys.objectLabel, item.key);

        item.inputMap.set(this.inputKeys.isSlideToggle, this.containSetting(item, MatItemSettingType.SLIDE_TOGGLE));
        item.inputMap.set(this.inputKeys.disable, this.containSetting(item, MatItemSettingType.DISABLE));
        item.inputMap.set(this.inputKeys.required, this.containSetting(item, MatItemSettingType.REQUIRE));
        item.inputMap.set(this.inputKeys.isTextArea, this.containSetting(item, MatItemSettingType.TEXT_AREA));
        item.inputMap.set(this.inputKeys.isOptions, this.containSetting(item, MatItemSettingType.OPTIONS));
        item.inputMap.set(this.inputKeys.isEmail, this.containSetting(item, MatItemSettingType.VALIDATE_EMAIL));
        item.inputMap.set(this.inputKeys.isHttps, this.containSetting(item, MatItemSettingType.AUTO_FILL_HTTPS));
        item.inputMap.set(this.inputKeys.showListSizeInput, this.containSetting(item, MatItemSettingType.LIST_SHOW_LIST_SIZE_INPUT));
        item.inputMap.set(this.inputKeys.showListAddItemButton, this.containSetting(item, MatItemSettingType.LIST_SHOW_ADD_ITEM_BUTTON));
        item.inputMap.set(this.inputKeys.showListRemoveItemButton, this.containSetting(item, MatItemSettingType.LIST_SHOW_REMOVE_ITEM_BUTTON));
        item.inputMap.set(this.inputKeys.isRecord, this.containSetting(item, MatItemSettingType.RECORD));
        item.inputMap.set(this.inputKeys.showGotoButton, this.containSetting(item, MatItemSettingType.SHOW_GOTO_BUTTON));
        item.inputMap.set(this.inputKeys.readonly, this.containSetting(item, MatItemSettingType.READ_ONLY));
        item.inputMap.set(this.inputKeys.listRequired, this.containSetting(item, MatItemSettingType.LIST_REQUIRE));

        item.settings.forEach(setting => {
          let type = setting.type;
          let value = setting.value;
          
          item.inputMap.set(type as keyof MatFormFieldTypeMap, value);
        })

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
    let value = this.getValue()[key];

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
    for(let typeName in MatFormFieldInputKeys) {
      let name = key + typeName;
      let value = prototype[name];
      if (Object.hasOwn(prototype, name)) {
        settings.push(new MatItemSetting(typeName, value));
      }
    }

    return settings;
  }

  public getTextAreaSettingValue(key: string): boolean {
    if(this.getInputValue(this.inputKeys.isTextArea))
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

  // The declared type wins. blankObject reflects the model's typed field
  // (e.g. `basePrice: string = '0'`), which is authoritative — the runtime
  // value can drift from that on the wire: BigDecimal fields declared as
  // string arrive from the backend as JSON numbers (`0.5`, `12`); nullable
  // strings arrive as `null`; booleans stored as tinyints in some DBs arrive
  // as `0`/`1`. Deciding by the runtime type would drop those into "Unknown
  // input type"; deciding by the declared type keeps the UI stable and lets
  // the input control coerce the display.
  //
  // If blankObject itself is null/undefined (rare, only when the parent
  // dynamic form couldn't resolve a blank for this key), fall back to the
  // runtime value's type so we still render something sensible.
  private declaredTypeIs(kind: 'string' | 'number' | 'boolean'): boolean {
    if (this.blankObject !== null && this.blankObject !== undefined) {
      return typeof this.blankObject === kind;
    }
    return typeof this.getValue() === kind;
  }

  override isValueMultipleStringLine(): boolean {
    if (!this.declaredTypeIs('string')) return false;
    const v = this.getValue();
    const isMulti = (typeof v === 'string' && v.includes('\n'))
                 || (typeof this.blankObject === 'string' && this.blankObject.includes('\n'));
    return (isMulti || this.getInputValue(this.inputKeys.isTextArea))
        && !this.getInputValue(this.inputKeys.isOptions);
  }

  override isValueNonMultipleStringLine(): boolean {
    if (!this.declaredTypeIs('string')) return false;
    const v = this.getValue();
    const isMulti = (typeof v === 'string' && v.includes('\n'))
                 || (typeof this.blankObject === 'string' && this.blankObject.includes('\n'));
    return !isMulti
        && !this.getInputValue(this.inputKeys.isTextArea)
        && !this.getInputValue(this.inputKeys.isOptions);
  }

  override isValueNumber(): boolean {
    return this.declaredTypeIs('number') && !this.getInputValue(this.inputKeys.isOptions);
  }

  override isValueBoolean(): boolean {
    return this.declaredTypeIs('boolean');
  }

  override isValueArray(): boolean {
    return this.getInputValue(this.inputKeys.isBlankObjectArray) || super.isValueArray();
  }

  isValueRecord(): boolean {
    return this.getInputValue(this.inputKeys.isRecord);
  }
}
