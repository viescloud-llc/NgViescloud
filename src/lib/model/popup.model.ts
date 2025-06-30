import { UnaryFunction } from "rxjs";

export const POPUP_DATA = 'POPUP_DATA';
export const POPUP_DISMISS = 'POPUP_DISMISS';

export enum PopupType {
    NONE = "NONE",
    STRING_SNACKBAR = "STRING_SNACKBAR",
    DYNAMIC_STRING_SNACKBAR = "DYNAMIC_STRING_SNACKBAR",
    LOADING_DIALOG = "LOADING_DIALOG",
    MESSAGE_POPUP = "MESSAGE_POPUP",
    DYNAMIC_MESSAGE_POPUP = "DYNAMIC_MESSAGE_POPUP"
}

export type PopupArgs = {
    type?: PopupType,
    message?: string,
    dismissLabel?: string,
    vertical?: 'top' | 'bottom',
    horizontal?: 'left' | 'middle' | 'right',
    ttl?: number
    maxLength?: number,
    viewFullOnHover?: boolean,
    unaryFunction?: UnaryFunction<any, any>
}

export type DialogArgs = {
    title?: string,
    message?: string,
    yes?: string,
    no?: string,
    width?: string,
    disableClose?: boolean,
    defaultMessage?: string,
    error: any,
    unaryFunction?: UnaryFunction<any, any>
}