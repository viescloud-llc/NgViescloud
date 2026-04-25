import { HttpParams } from "@angular/common/http";
import { computed, signal, Signal } from "@angular/core";
import { ThemePalette } from "@angular/material/core";
import { MatFormFieldAppearance } from "@angular/material/form-field";
import { DataUtils } from "../util/Data.utils";
import { MatFromFieldInputDynamicItem, MatOption } from "./mat.model";

export class HttpParamsBuilder {
  private params = new HttpParams();

  constructor(params?: HttpParams) {
    if(params) {
      this.params = params;
    }
    else {
      this.params = new HttpParams();
    }
  }

  set(key: string, value: any) {
    this.params = this.params.set(key, value);
    return this;
  }

  setIf(key: string, value: any, producerFn: (value: any) => boolean) {
    if(producerFn(value)) {
      this.params = this.params.set(key, value);
    }

    return this;
  }

  setIfValid(key: string, value?: any) {
    if(value instanceof Boolean) {
      this.params = this.params.set(key, value.toString());
    }
    else if (value) {
      this.params = this.params.set(key, value);
    }

    return this;
  }

  build(): HttpParams {
    return this.params;
  }

  toMap(): Map<string, string> {
    let map = new Map<string, string>();
    this.params.keys().forEach(key => map.set(key, this.params.get(key)!));
    return map;
  }
}

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
  inputOptions:          { key: 'inputOptions',         value: field<string[]>([]) },
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