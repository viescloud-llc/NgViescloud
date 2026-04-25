import { MatDialog } from "@angular/material/dialog";
import { MatFormFields } from "./utils.model";

export interface DialogSetting {
  matDialog?: MatDialog;
  title?: string;
  width?: string;
  height?: string;
  disableClose?: boolean;
  yes?: string;
  no?: string;
  settings?: (inputMap: MatFormFields) => MatFormFields;
}

export class DialogResponse<T> {
  result!: T;
  sucess: boolean = false;
  revert: boolean = false;
  remove: boolean = false;
  cancel: boolean = false;

  static builder<T>(): DialogResponseBuilder<T> {
    return new DialogResponseBuilder<T>();
  }
}

export class DialogResponseBuilder<T> {
  private response: DialogResponse<T> = new DialogResponse<T>();

  result(result: T): DialogResponseBuilder<T> {
    this.response.result = result;
    return this;
  }

  save(): DialogResponseBuilder<T> {
    this.response.sucess = true;
    return this;
  }

  revert(): DialogResponseBuilder<T> {
    this.response.revert = true;
    return this;
  }

  remove(): DialogResponseBuilder<T> {
    this.response.remove = true;
    return this;
  }

  cancel(): DialogResponseBuilder<T> {
    this.response.cancel = true;
    return this;
  }

  build(): DialogResponse<T> {
    return this.response;
  }
}