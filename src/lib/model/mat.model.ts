import { ThemePalette } from "@angular/material/core";
import { DataUtils } from "../util/Data.utils";
import { ViesUtils } from "../util/Vies.utils";
import { MatFormFieldAppearance } from "@angular/material/form-field";
import { signal, Signal } from "@angular/core";

export enum MatType {
    OBJECT = 'object',
    ARRAY = 'array',
    STRING = 'string',
    NUMBER = 'number',
    BOOLEAN = 'boolean'
}

export enum MatItemSettingType {
    REQUIRE = <any>'RequireItem',
    DISABLE = <any>'DisableItem',
    READ_ONLY = <any>'ReadOnlyItem',
    CUSTOM_LABEL = <any>'CustomLabelItem',
    CUSTOM_PLACEHOLDER = <any>'CustomPlaceholderItem',
    INDEX = <any>'IndexItem',
    TEXT_AREA = <any>'TextAreaItem',
    RECORD = <any>'RecordItem',
    SLIDE_TOGGLE = <any>'SlideToggleItem',
    VALIDATE_EMAIL = <any>'ValidateEmailItem',
    AUTO_FILL_HTTPS = <any>'AutoFillHttpsItem',
    EXPANSION_PANEL = <any>'ExpansionPanelItem',
    OPTIONS = <any>'OptionsItem',
    HIDE = <any>'HideItem',
    SHOW_GOTO_BUTTON = <any>'ShowGotoButtonItem',
    LIST_SHOW_LIST_SIZE_INPUT = <any>'ListShowListSizeInputItem',
    LIST_SHOW_REMOVE_ITEM_BUTTON = <any>'ListShowRemoveItemButtonItem',
    LIST_SHOW_ADD_ITEM_BUTTON = <any>'ListShowAddItemButtonItem',
    LIST_REQUIRE = <any>'ListRequireItem'
}

export enum MatTableSettingType {
    DISPLAY_VALUE_FN = <any>'DisplayValueFn',
    DISPLAY_LABEL = <any>'LabelColumn',
    INDEX = <any>'IndexColumn',
    HIDE = <any>'HideColumn'
}

export enum MatSnackBarHorizontalPosition {
    START = "start",
    CENTER = "center",
    END = "end",
    LEFT = "left",
    RIGHT = "right"
}

export enum MatSnackBarVerticalPosition {
    TOP = "top",
    BOTTOM = "bottom"
}

export class MatItemSetting {
    type: MatItemSettingType | keyof MatFormFieldTypeMap | string;
    value: any;

    constructor(type: MatItemSettingType | keyof MatFormFieldTypeMap | string, value?: any) {
        this.type = type;
        if(value)
            this.value = value;
        else
            this.value = type;
    }

    equalType(type: MatItemSettingType | keyof MatFormFieldTypeMap) {
        return this.type === type;
    }
}

export interface MatDialogItem {
    getIdFn: () => any;
}

export interface MatColumn {
    key: string;
    index: number;
    label?: string;
    getDisplayValueFn?: (obj: any) => any;
}

export interface MatOption<T> {
    value: T,
    valueLabel: string,
    disable?: boolean
}

export function isMatOption<T = any>(obj: any): obj is MatOption<T> {
    return (
        obj !== null &&
        typeof obj === 'object' &&
        'value' in obj &&
        typeof obj.valueLabel === 'string' &&
        (
            obj.disable === undefined ||
            typeof obj.disable === 'boolean'
        )
    );
}

export class MatListItem<T> {
    constructor(private ref?: T, public key?: string, private setter?: (ref: T, value: T) => void, private getter?: (ref: T) => any, public disable: boolean = false) { }

    getValue() {
        if (this.ref && this.getter)
            return this.getter(this.ref);
    }

    setValue(value: T) {
        if (this.ref && this.setter)
            this.setter(this.ref, value);
    }

    isEmpty() {
        return !this.ref;
    }
}

export class MatList<T> {

    constructor(protected list: T[], private MatType: MatType) {
    }

    createEmptyItem(): T {
        switch (this.MatType) {
            case MatType.OBJECT:
                return {} as T;
            case MatType.ARRAY:
                return [] as T;
            case MatType.STRING:
                return '' as T;
            case MatType.NUMBER:
                return 0 as T;
            case MatType.BOOLEAN:
                return false as T;
            default:
                break;
        }

        throw new Error("Mat Type not supported");
    }

    pushEmptyItem(): void {
        let item = this.createEmptyItem();
        this.list.push(item);
    }

    getMatType(): MatType {
        return this.MatType;
    }

    getType(): string {
        return this.MatType;
    }

    getList(): T[] {
        return this.list;
    }

    getCopyList(): T[] {
        return structuredClone(this.list);
    }

    size(): number {
        return this.list.length;
    }

    getMatItemList(): MatListItem<T>[] {
        throw new Error("Mat item list not supported");
    }
}

export class MatFromFieldInputDynamicItem {
    ref: any;
    value: any;
    key: string = '';
    blankObject: any;
    isBlankObjectArray: boolean = false;
    settings: MatItemSetting[] = [];
    index?: number;
    matOptions: MatOption<any>[] = [];
    inputMap: MatFormFields = MatFormFields.new().addInputDefault();

    constructor() {}

    setValueFn(value: any) {
        DataUtils.setAnyValue(this.ref[this.key], value, () => this.ref[this.key] = value);
    };

    containSetting(setting: string | MatItemSettingType): boolean {
        let include = false;

        let foundReverse = MatItemSettingType[setting as any];

        if(foundReverse) {
            this.settings.forEach(e => {
                if(e.equalType(setting as MatItemSettingType))
                    include = true;
            })
        }
        else {
            this.settings.forEach(e => {
                if(e.type === setting) {
                    include = true;
                }
            })
        }

        if(typeof setting === 'string') {
            setting = MatItemSettingType[setting.toUpperCase() as any];
            if(setting) {
                this.settings.forEach(e => {
                    if(e.equalType(setting as MatItemSettingType))
                        include = true;
                })
            }
        }

        return include;
    }
}

export interface Tuple<T, U> {
    first: T;
    second: U;
}

// ------------------------------ Mat input -----------------------------

/**
 * this function set a field dynamic input to disable
 * @param disable input is disable
 * @returns
 */
export const MatInputDisable = (disable?: boolean) => {
    return function MatInputDisable(object: any, key: any) {
        addValue(object, key, MatItemSettingType.DISABLE.toString(), disable, true);
    }
}

/**
 * this function set all field in object to be disable in dynamic input
 * @param disable input is disable
 * @returns
 */
export const MatInputDisableAll = (disable: boolean, keys: string[]) => {
    return function MatInputDisableAll(object: any) {
        for(let key of keys) {
            addValue(object.prototype, key, MatItemSettingType.DISABLE.toString(), disable, true);
        }
    }
}


/**
 * this function set a field dynamic input to require
 * @param require input is require
 * @returns
 */
export const MatInputRequire = (require?: boolean) => {
    return function MatInputRequire(object: any, key: any) {
        addValue(object, key, MatItemSettingType.REQUIRE.toString(), require, true);
    }
}

/**
 * this function set all field in object to be require in dynamic input
 * @param require input is require
 * @returns
 */
export const MatInputRequireAll = (require: boolean, keys: string[]) => {
    return function MatInputRequireAll(object: any) {
        for(let key of keys) {
            addValue(object.prototype, key, MatItemSettingType.REQUIRE.toString(), require, true);
        }
    }
}

/**
 * this function set a field dynamic input to hidden
 * @param hide hidden this input
 * @returns
 */
export const MatInputHide = (hide?: boolean) => {
    return function MatInputHide(object: any, key: any) {
        addValue(object, key, MatItemSettingType.HIDE.toString(), hide, true);
    }
}

/**
 * this function set all field in object to be hidden in dynamic input
 * @param hide hidden this input
 * @returns
 */
export const MatInputHideAll = (hide: boolean, keys: string[]) => {
    return function MatInputHideAll(object: any) {
        for(let key of keys) {
            addValue(object.prototype, key, MatItemSettingType.HIDE.toString(), hide, true);
        }
    }
}

export const MatInputReadOnly = (readonly?: boolean) => {
  return function MatInputReadOnly(object: any, key: any) {
      addValue(object, key, MatItemSettingType.READ_ONLY.toString(), readonly, true);
  }
}

/**
 * this function set a field dynamic input to be text area
 * @param disable input is text area
 * @returns
 */
export const MatInputTextArea = (disable?: boolean) => {
    return function MatInputTextArea(object: any, key: any) {
        addValue(object, key, MatItemSettingType.TEXT_AREA.toString(), disable, true);
    }
}

/**
 * this function set a field dynamic input to have expansion panel
 * @param disable input have expansion panel
 * @returns
 */
export const MatInputExpansionPanel = (disable?: boolean) => {
    return function MatInputExpansionPanel(object: any, key: any) {
        addValue(object, key, MatItemSettingType.EXPANSION_PANEL.toString(), disable, true);
    }
}

export const MatInputRecord = (disable?: boolean) => {
  return function MatInputRecord(object: any, key: any) {
      addValue(object, key, MatItemSettingType.RECORD.toString(), disable, true);
  }
}

/**
 * This function generates options for a dynamic input field.
 *
 * @param {Array<string|number>} options - An array of options to be used in the input field.
 * @return {Function} A function that adds options to an object.
 */
export const MatInputOptions = (options: (string | number)[], noneLabel?: string | number, noneValue?: string | number) => {
    return function MatInputOptions(object: any, key: any) {
        let matOptions: MatOption<any>[] = [];
        if(noneLabel) {
            matOptions.push({
                value: noneValue,
                valueLabel: noneLabel.toString()
            })
        }
        options.forEach(option => {
            matOptions.push({
                value: option,
                valueLabel: option.toString()
            })
        })
        addValue(object, key, MatItemSettingType.OPTIONS.toString(), matOptions, matOptions);
    }
}

export const MatInputEnum = (Enum: any, noneLabel?: string | number, noneValue?: string | number) => {
    return function MatInputEnum(object: any, key: any) {
        let matOptions = ViesUtils.enumValuesToMatOptions(Enum, noneLabel, noneValue);
        addValue(object, key, MatItemSettingType.OPTIONS.toString(), matOptions, matOptions);
    }
}

/**
 * this function is all in one setting for dynamic input component
 * @param index indexing input
 * @param require input is require
 * @param disable input is disable
 * @param hide hidden this input
 * @returns
 */
export const MatInputSetting = (index: number, require?: boolean, disable?: boolean, hide?: boolean) => {
    return function MatInputSetting(object: any, key: any) {
        addValue(object, key, MatItemSettingType.INDEX.toString(), index, 0);
        addValue(object, key, MatItemSettingType.DISABLE.toString(), disable, false);
        addValue(object, key, MatItemSettingType.REQUIRE.toString(), require, false);
        addValue(object, key, MatItemSettingType.HIDE.toString(), hide, false);
    }
}

export const MatInputIndex = (index: number) => {
    return function MatInputIndex(object: any, key: any) {
        addValue(object, key, MatItemSettingType.INDEX.toString(), index, 0);
    }
}

export const MatInputDisplayLabel = (label?: string, placeholder?: string) => {
    return function MatInputDisplayLabel(object: any, key: any) {
        addValue(object, key, MatItemSettingType.CUSTOM_LABEL.toString(), label, '');
        addValue(object, key, MatItemSettingType.CUSTOM_PLACEHOLDER.toString(), placeholder, '');
    }
}

export const MatInputListSetting = (showListSizeInput?: boolean, showAddItemButton?: boolean, showRemoveItemButton?: boolean) => {
    return function MatInputListSetting(object: any, key: any) {
        addValue(object, key, MatItemSettingType.LIST_SHOW_LIST_SIZE_INPUT.toString(), showListSizeInput, true);
        addValue(object, key, MatItemSettingType.LIST_SHOW_ADD_ITEM_BUTTON.toString(), showAddItemButton, true);
        addValue(object, key, MatItemSettingType.LIST_SHOW_REMOVE_ITEM_BUTTON.toString(), showRemoveItemButton, true);
    }
}

export const MatInputItemSetting = (type: MatItemSettingType, value: any = true) => {
    return function MatInputItemSetting(object: any, key: any) {
        addValue(object, key, type.toString(), value, value);
    }
}

// Mat table
/**
 *
 * @param index indexing this column
 * @returns
 */
export const MatTableIndex = (index: number) => {
    return function MatTableIndex(object: any, key: any) {
        addValue(object, key, MatTableSettingType.INDEX.toString(), index, 0);
    }
}

/**
 *
 * @param hide hidden column
 * @returns
 */
export const MatTableHide = (hide?: boolean) => {
    return function MatTableHide(object: any, key: any) {
        addValue(object, key, MatTableSettingType.HIDE.toString(), hide, true);
    }
}

/**
 *
 * @param label label of column
 * @param displayValueFn this function should be (obj: T) => string
 * @returns
 */
export const MatTableDisplayLabel = (label?: string, displayValueFn?: Function) => {
    return function MatTableDisplayLabel(object: any, key: any) {
        addValue(object, key, MatTableSettingType.DISPLAY_LABEL.toString(), label, null);
        addValue(object, key, MatTableSettingType.DISPLAY_VALUE_FN.toString(), displayValueFn, null);
    }
}

export const MatTableDisplayValue = (displayValueFn: Function) => {
    return function MatTableDisplayValue(object: any, key: any) {
        addValue(object, key, MatTableSettingType.DISPLAY_VALUE_FN.toString(), displayValueFn, null);
    }
}

export const MatTableSettings = (settings: {label?: string, displayValueFn?: Function, hide?: boolean, index?: number}) => {
    return function MatTableSettings(object: any, key: any) {
        if(settings.label) {
            addValue(object, key, MatTableSettingType.DISPLAY_LABEL.toString(), settings.label, null);
        }
        if(settings.displayValueFn) {
            addValue(object, key, MatTableSettingType.DISPLAY_VALUE_FN.toString(), settings.displayValueFn, null);
        }
        if(settings.hide) {
            addValue(object, key, MatTableSettingType.HIDE.toString(), settings.hide, true);
        }
        if(settings.index) {
            addValue(object, key, MatTableSettingType.INDEX.toString(), settings.index, 0);
        }
    }
}

export const addGetPrototype = (object: any) => {
    Object.defineProperty(object, "getPrototype", {
        value: function a() {},
        writable: true,
        configurable: true,
        enumerable: true
    })
}

/**
 * Adds a new property to the given object with a name derived from the key and suffix.
 *
 * @param {any} object - The object to which the property will be added.
 * @param {any} key - The base name of the property.
 * @param {string} surFix - The suffix to append to the key to form the property name.
 * @param {any} value - The value of the property.
 * @param {any} defaultValue - The default value to use if the value is null or undefined.
 * @return {void}
 */
const addValue = (object: any, key: any, surFix: string, value: any, defaultValue: any) => {
    let name = key + surFix;

    Object.defineProperty(object, name, {
        value: value ?? defaultValue,
        writable: true,
        configurable: true,
        enumerable: true
    })
}

// ----------------------------V2----------------------------

type FieldConfig<T> = {
  default: T;
  type: T;
};

function field<T>(defaultValue: T): FieldConfig<T> {
  return { default: defaultValue, type: defaultValue };
}

function toKeys<T extends Record<string, { key: string }>>(obj: T): { [K in keyof T]: T[K]['key'] } {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v.key])
  ) as { [K in keyof T]: T[K]['key'] };
}

export const MatFormFieldOutput = {
  onEnter:    {key: 'onEnter', value: field(undefined)},
  onFocusout: {key: 'onFocusout', value: field(undefined)},
  onFocus:    {key: 'onFocus', value: field(undefined)},
} as const;

export const MatFormFieldOutputKeys = toKeys(MatFormFieldOutput);

export const MatFormFieldInput = {
  // MatFormField
  error:                 { key: 'error',                value: field<string>('')          },
  matColor:              { key: 'matColor',             value: field<ThemePalette>('primary') },
  appearance:            { key: 'appearance',           value: field<MatFormFieldAppearance>('fill') },
  label:                 { key: 'label',                value: field<string>('')          },
  placeholder:           { key: 'placeholder',          value: field<string>('')          },
  required:              { key: 'required',             value: field<boolean>(false)      },
  disable:               { key: 'disable',              value: field<boolean>(false)      },
  fakeDisable:           { key: 'fakeDisable',          value: field<boolean>(false)      },
  width:                 { key: 'width',                value: field<number>(40)          },
  height:                { key: 'height',               value: field<number | null>(null) },
  styleWidth:            { key: 'styleWidth',           value: field<string>('')          },
  styleHeight:           { key: 'styleHeight',          value: field<string>('')          },
  autoResize:            { key: 'autoResize',           value: field<boolean>(false)      },
  defaultErrorTextColor: { key: 'defaultErrorTextColor',value: field<string>('red')       },
  readonly:              { key: 'readonly',             value: field<boolean>(false)      },
  readonlyOnFocusHintLeft:    { key: 'readonlyOnFocusHintLeft',  value: field<string>('Read only') },
  readonlyOnFocusHintRight:   { key: 'readonlyOnFocusHintRight', value: field<string>('') },

  // MatFormFieldInput
  maxlength:             { key: 'maxlength',            value: field<number | null>(null) },
  minlength:             { key: 'minlength',            value: field<number | null>(null) },
  showGoto:              { key: 'showGoto',             value: field<boolean>(false) },
  showClearIcon:         { key: 'showClearIcon',        value: field<boolean>(true) },
  showVisibleSwitch:     { key: 'showVisibleSwitch',    value: field<boolean>(false) },
  showCopyToClipboard:   { key: 'showCopyToClipboard',  value: field<boolean>(false) },
  showGenerateValue:     { key: 'showGenerateValue',    value: field<boolean>(false) },
  showMinMaxHint:        { key: 'showMinMaxHint',       value: field<boolean>(false) },
  alwayUppercase:        { key: 'alwayUppercase',       value: field<boolean>(false) },
  alwayLowercase:        { key: 'alwayLowercase',       value: field<boolean>(false) },
  manuallyEmitValue:     { key: 'manuallyEmitValue',    value: field<boolean>(false) },
  onFocusoutEmitValueOnly:{ key: 'onFocusoutEmitValueOnly', value: field<boolean>(true) },
  copyDisplayMessage:    { key: 'copyDisplayMessage',   value: field<string>('') },
  switchVisibility:      { key: 'switchVisibility',     value: field<boolean>(false) },
  defaultType:           { key: 'defaultType',          value: field<string>('text') },
  switchType:            { key: 'switchType',           value: field<string>('password') },
  onIcon:                { key: 'onIcon',               value: field<string>('visibility') },
  offIcon:               { key: 'offIcon',              value: field<string>('visibility_off') },
  manuallyEmitValueHint: { key: 'manuallyEmitValueHint',value: field<string>('Press apply icon or enter to apply input') },
  customIconHint:        { key: 'customIconHint',       value: field<string>('') },
  min:                   { key: 'min',                  value: field<number | null>(null) },
  max:                   { key: 'max',                  value: field<number | null>(null) },
  customIconLabel:       { key: 'customIconLabel',      value: field<string>('') },
  validateEmail:         { key: 'validateEmail',        value: field<boolean>(false) },
  autoFillHttps:         { key: 'autoFillHttps',        value: field<boolean>(false) },
  focusOutAutoFillFn:    { key: 'focusOutAutoFillFn',   value: field<((value: any) => any) | undefined>(undefined) },
  optionsAutoActiveFirst:{ key: 'optionsAutoActiveFirst',value: field<boolean>(true) },
  optionsrequireSelection:{ key: 'optionsrequireSelection',value: field<boolean>(false) },

  // MatFormFieldInputTextArea
  rows:                  { key: 'rows',                 value: field<number | undefined>(undefined) }, // min height
  cols:                  { key: 'cols',                 value: field<number | undefined>(undefined) }, // min width
  autoResizeHeight:      { key: 'autoResizeHeight',     value: field<boolean>(true) },
  showEnterIcon:         { key: 'showEnterIcon',        value: field<boolean>(false) },
  showResizeVerticalButton: { key: 'showResizeVerticalButton', value: field<boolean>(false) },
  autoScrollToBottom:    { key: 'autoScrollToBottom',   value: field<boolean>(false) },

  // MatFormFieldInputOption
  customOptionLabel:     { key: 'customOptionLabel',    value: field<string>('') },
  customOptionLabelColor:{ key: 'customOptionLabelColor',value: field<string>('') },

  // MatFormFieldInputRecord
  showSizeInput:          { key: 'showSizeInput',        value: field<boolean>(true) },
  showRemoveItemButton:   { key: 'showRemoveItemButton', value: field<boolean>(true) },
  showAddItemButton:      { key: 'showAddItemButton',    value: field<boolean>(true) },
  maxSize:                { key: 'maxSize',              value: field<number>(100) },
  minSize:                { key: 'minSize',              value: field<number>(0) },
  expanded:               { key: 'expanded',             value: field<boolean>(false) },

  // MatFormFieldInputList
  showDragAndDropButton:  { key: 'showDragAndDropButton',value: field<boolean>(true) },
  listFocusOutAutoFillFn: { key: 'listFocusOutAutoFillFn',value: field<((value: any, index: number) => any) | undefined>(undefined) },

  // MatFormFieldInputListOption
  uniqueValue:            { key: 'uniqueValue',          value: field<boolean>(false) },
  showSearchOption:       { key: 'showSearchOption',     value: field<boolean>(false) },

  // MatFormFieldInputDynamic
  isPassword:              { key: 'isPassword',              value: field<boolean>(false) },
  isEmail:                 { key: 'isEmail',                 value: field<boolean>(false) },
  isTextArea:              { key: 'isTextArea',              value: field<boolean>(false) },
  isSlideToggle:           { key: 'isSlideToggle',           value: field<boolean>(false) },
  isOptions:               { key: 'isOptions',               value: field<boolean>(false) },
  isHttps:                 { key: 'isHttps',                 value: field<boolean>(false) },
  isRecord:                { key: 'isRecord',                value: field<boolean>(false) },
  isBlankObjectArray:      { key: 'isBlankObjectArray',      value: field<boolean>(false) },
  showGotoButton:          { key: 'showGotoButton',          value: field<boolean>(false) },
  showListSizeInput:       { key: 'showListSizeInput',       value: field<boolean>(false) },
  showListRemoveItemButton:{ key: 'showListRemoveItemButton',value: field<boolean>(true) },
  showListAddItemButton:   { key: 'showListAddItemButton',   value: field<boolean>(true) },
  listRequired:            { key: 'listRequired',            value: field<boolean>(false) },
  indent:                  { key: 'indent',                  value: field<boolean>(true) },
  matOptions:              { key: 'matOptions',              value: field<MatOption<any>[] | undefined>(undefined) },
  objectLabel:             { key: 'objectLabel',             value: field<string | undefined>(undefined) },

  // dialog
  isDialog:                { key: 'isDialog',                value: field<boolean>(false) },
  dialogTitle:             { key: 'dialogTitle',             value: field<string>('') },

  // MatFormFieldFormComponent
  isConfirmDelete:         { key: 'isConfirmDelete',         value: field<boolean>(true) },
  isConfirmRevert:         { key: 'isConfirmRevert',         value: field<boolean>(false) },
  isConfirmSave:           { key: 'isConfirmSave',           value: field<boolean>(false) },
  saveLabel:               { key: 'saveLabel',               value: field<string>('Save') },
  revertLabel:             { key: 'revertLabel',             value: field<string>('Revert') },
  removeLabel:             { key: 'removeLabel',             value: field<string>('Delete') },
  cancelLabel:             { key: 'cancelLabel',             value: field<string>('Cancel') },

  // MatFormFieldInputDynamicForm
  hideRevertButton:        { key: 'hideRevertButton',        value: field<boolean>(false) },
  hideRemoveButton:        { key: 'hideRemoveButton',        value: field<boolean>(false) },

} as const;

export const MatFormFieldInputKeys = toKeys(MatFormFieldInput);

export type MatFormFieldTypeMap = {
  [K in keyof typeof MatFormFieldOutput]: typeof MatFormFieldOutput[K]['value']['default']
} & {
  [K in keyof typeof MatFormFieldInput]: typeof MatFormFieldInput[K]['value']['default']
};

export class MatFormFields {

  private map = new Map<String | string, any>();
  public readonly inputKeys = MatFormFieldInputKeys;
  public readonly outputKeys = MatFormFieldOutputKeys;

  static new() {
    return new MatFormFields();
  }

  constructor(map?: Map<String | string, any>) {
    if(map) {
      this.map = map;
    }
  }


  set<K extends keyof MatFormFieldTypeMap>(key: K, value: MatFormFieldTypeMap[K] | Signal<MatFormFieldTypeMap[K]>) {
    this.map.set(key, value);
    return this;
  }

  setIfEmpty(key: any extends keyof MatFormFieldTypeMap ? never : keyof MatFormFieldTypeMap, value: MatFormFieldTypeMap[keyof MatFormFieldTypeMap]) {
    if(!this.map.has(key) || this.get(key)) {
      this.map.set(key, value);
    }
    return this;
  }

  get<T>(key: any extends keyof MatFormFieldTypeMap ? never : keyof MatFormFieldTypeMap): T {
    return this.map.get(key) as T;
  }

  getValue<K extends keyof MatFormFieldTypeMap>(key: K): MatFormFieldTypeMap[K] {
    return DataUtils.getAnyValue(this.map.get(key));
  }

  increaseValue<K extends keyof MatFormFieldTypeMap>(key: K) {
    if(this.map.has(key)) {
      let currentValue = this.map.get(key);
      if(Number.isNaN(currentValue) === false && currentValue !== undefined) {
        currentValue = currentValue + 1;
        this.map.set(key, currentValue);
        return currentValue;
      }
    }

    return undefined;
  }

  decreaseValue<K extends keyof MatFormFieldTypeMap>(key: K) {
    if(this.map.has(key)) {
      let currentValue = this.map.get(key);
      if(Number.isNaN(currentValue) === false && currentValue !== undefined) {
        currentValue = currentValue - 1;
        this.map.set(key, currentValue);
        return currentValue;
      }
    }

    return undefined;
  }

  addOutputDefault() {
    for (const { key, value: { default: val } } of Object.values(MatFormFieldOutput)) {
      if (!this.map.has(key)) {
        this.map.set(key, signal(val));
      }
    }
    return this;
  }

  addInputDefault() {
    for (const { key, value: { default: val } } of Object.values(MatFormFieldInput)) {
      if (!this.map.has(key)) {
        this.map.set(key, signal(val));
      }
    }
    return this;
  }

  clone<K extends keyof MatFormFieldTypeMap>(specificKeys?: K[], addDefault = true) {
    if(specificKeys) {
      let newMap = new MatFormFields();

      if(addDefault) {
        newMap.addInputDefault();
      }

      specificKeys.forEach(key => newMap.set(key, this.map.get(key)));
      return newMap;
    }
    else {
      try {
        return structuredClone(this);
      } catch (error) {
        let newMap = new Map<String | string, any>();
        this.map.forEach((value, key) => newMap.set(key, value));
        return new MatFormFields(newMap);
      }
    }
  }
}

type MatInputSettingItem = {
  [K in keyof MatFormFieldTypeMap]: {
    type: K;
    value: MatFormFieldTypeMap[K];
  }
}[keyof MatFormFieldTypeMap];

export const MatInputSettings = (setting1: {index?: number, require?: boolean, disable?: boolean, hide?: boolean}, ...setting2: MatInputSettingItem[] | { type: MatItemSettingType, value?: any }[]) => {
    return function MatInputSettings(object: any, key: any) {

        if(setting1.index) {
            addValue(object, key, MatItemSettingType.INDEX.toString(), setting1.index, 0);
        }

        if(setting1.require) {
            addValue(object, key, MatItemSettingType.REQUIRE.toString(), setting1.require, false);
        }

        if(setting1.disable) {
            addValue(object, key, MatItemSettingType.DISABLE.toString(), setting1.disable, false);
        }

        if(setting1.hide) {
            addValue(object, key, MatItemSettingType.HIDE.toString(), setting1.hide, false);
        }

        for(let setting of setting2) {
            addValue(object, key, setting.type.toString(), setting.value, setting.value);
        }
    }
}