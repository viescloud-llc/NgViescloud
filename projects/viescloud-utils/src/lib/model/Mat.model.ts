import { UtilsService } from "../service/Utils.service";

export enum PropertyMatcherEnum {
    CASE_SENSITIVE = "CASE_SENSITIVE",
    CONTAINS = "CONTAINS",
    ENDS_WITH = "ENDS_WITH",
    EXACT = "EXACT",
    IGNORE_CASE = "IGNORE_CASE",
    REGEX = "REGEX",
    STARTS_WITH = "STARTS_WITH",
    DEFAULT = "DEFAULT"
}

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
    CUSTOM_LABEL = <any>'CustomLabelItem',
    CUSTOM_PLACEHOLDER = <any>'CustomPlaceholderItem',
    INDEX = <any>'IndexItem',
    TEXT_AREA = <any>'TextAreaItem',
    VALIDATE_EMAIL = <any>'ValidateEmailItem',
    AUTO_FILL_HTTPS = <any>'AutoFillHttpsItem',
    EXPANSION_PANEL = <any>'ExpansionPanelItem',
    OPTIONS = <any>'OptionsItem',
    HIDE = <any>'HideItem',
    LIST_SHOW_LIST_SIZE_INPUT = <any>'ListShowListSizeInputItem',
    LIST_SHOW_REMOVE_ITEM_BUTTON = <any>'ListShowRemoveItemButtonItem',
    LIST_SHOW_ADD_ITEM_BUTTON = <any>'ListShowAddItemButtonItem',
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
    type: MatItemSettingType | string;
    value: any;

    constructor(type: MatItemSettingType | string, value?: any) {
        this.type = type;
        if(value)
            this.value = value;
        else
            this.value = type;
    }

    equalType(type: MatItemSettingType) {
        return this.type.toString() === type.toString();
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

export class DateTime {
    year?:            number = 0;
    month?:           number = 0;
    day?:             number = 0;
    hour?:            number = 0;
    minute?:          number = 0;
    second?:          number = 0;
    bypassMax?:       boolean = false;
    id?:              number = 0;
    time?:            string = '';
    date?:            string = '';
    dateTime?:        string = '';
    maxDayThisMonth?: number = 0;

    constructor(year?: number, month?: number, day?: number, hour?: number, minute?: number, second?: number, bypassMax?: boolean, id?: number, time?: string, date?: string, dateTime?: string, maxDayThisMonth?: number) {
        this.year = year;
        this.month = month;
        this.day = day;
        this.hour = hour;
        this.minute = minute;
        this.second = second;
        this.bypassMax = bypassMax;
        this.id = id;
        this.time = time;
        this.date = date;
        this.dateTime = dateTime;
        this.maxDayThisMonth = maxDayThisMonth;
    }
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
    blankObject: any;
    key: string = '';
    label: string = '';
    placeholder = '';
    value: any;
    settings: MatItemSetting[] = [];
    index?: number;
    matOptions: MatOption<any>[] = [];

    constructor() {}

    setValueFn(value: any) {
        this.ref[this.key] = value;
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
        let matOptions: MatOption<any>[] = [];
        let enumArray = UtilsService.getEnumValues(Enum);
        if(noneLabel) {
            matOptions.push({
                value: noneValue,
                valueLabel: noneLabel.toString()
            })
        }
        enumArray.forEach(option => {
            matOptions.push({
                value: option,
                valueLabel: option.toString()
            })
        })
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

export const MatInputItemSetting = (type: MatItemSettingType, value: any) => {
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
        addValue(object, key, MatTableSettingType.HIDE.toString(), hide, false);
    }
}

/**
 * 
 * @param label label of column
 * @param displayValueFn this function should be (obj: T) => string
 * @returns 
 */
export const MatTableSetting = (label?: string, displayValueFn?: Function) => {
    return function MatTableSetting(object: any, key: any) {
        addValue(object, key, MatTableSettingType.DISPLAY_LABEL.toString(), label, null);
        addValue(object, key, MatTableSettingType.DISPLAY_VALUE_FN.toString(), displayValueFn, null);
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