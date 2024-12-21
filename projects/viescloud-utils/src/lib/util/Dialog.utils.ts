import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { LoadingDialog } from "../dialog/loading-dialog/loading-dialog.component";
import { ConfirmDialog } from "../dialog/confirm-dialog/confirm-dialog.component";
import { Injectable } from "@angular/core";
import { ProductImageSwapDialog, ProductImageSwapDialogRespondData } from "../dialog/marketing/product-image-swap-dialog/product-image-swap-dialog.component";
import { MatOption } from "../model/Mat.model";
import { NotAuthenticatedError } from "../model/Error.model";
import { InputDialog } from "../dialog/input-dialog/input-dialog.component";

@Injectable({
    providedIn: 'root'
})
export class DialogUtils {

    constructor(public matDialog: MatDialog) {}

    openLoadingDialog(timeout?: number, disableClose: boolean = true) {
        return DialogUtils.openLoadingDialog(this.matDialog, timeout, disableClose);
    }

    static openLoadingDialog(matDialog: MatDialog, timeout?: number, disableClose: boolean = true): MatDialogRef<LoadingDialog, any> {
        let dialog = matDialog.open(LoadingDialog, {
            disableClose: disableClose
        })

        dialog.afterClosed().subscribe({
            next: () => { }
        })

        if (timeout) {
            setTimeout(() => {
                dialog.close();
            }, timeout);
        }

        return dialog;
    }

    openErrorMessageFromError(error: any) {
        if(!(error instanceof NotAuthenticatedError))
            this.openErrorMessage("Error!", error.getMessage);
    }

    openErrorMessage(title: string, message: string) {
        return this.openConfirmDialog(title, message, 'Ok', '', '100%');
    }

    openConfirmDialog(title: string, message: string, yes: string = 'Yes', no: string = 'No', width: string = '100%', disableClose: boolean = false) {
        return DialogUtils.openConfirmDialog(this.matDialog, title, message, yes, no, width, disableClose);
    }

    static openConfirmDialog(matDialog: MatDialog, title: string, message: string, yes: string = 'Yes', no: string = 'No', width: string = '100%', disableClose: boolean = false) {
        return new Promise<string>((resolve, reject) => {
            let dialog = matDialog.open(ConfirmDialog, {
                disableClose: disableClose,
                data: {
                    title: title,
                    message: message,
                    yes: yes,
                    no: no
                },
                width: width
            });

            dialog.afterClosed().subscribe({
                next: (result) => {
                    if(result)
                        resolve(result);
                    else
                        reject(result);
                },
                error: (error) => {
                    reject(error);
                }
            })
        })
    }

    openInputDialog(title: string, label: string, yes: string = 'Yes', no: string = 'No', multipleLine: boolean = false, input: string = '', placeholder: string = '', width: string = '100%', disableClose: boolean = false) {
      return DialogUtils.openInputDialog(this.matDialog, title, label, yes, no, multipleLine, input, placeholder, width, disableClose);
    }

    static openInputDialog(matDialog: MatDialog, title: string, label: string, yes: string = 'Yes', no: string = 'No', multipleLine: boolean = false, input: string = '', placeholder: string = '', width: string = '100%', disableClose: boolean = false) {
      return new Promise<string>((resolve, reject) => {
        let dialog = matDialog.open(InputDialog, {
            disableClose: disableClose,
            data: {
                title: title,
                label: label,
                yes: yes,
                no: no,
                multipleLine: multipleLine,
                input: input,
                placeholder: placeholder
            },
            width: width
        });

        dialog.afterClosed().subscribe({
            next: (result) => {
                if(result)
                    resolve(result);
                else
                    reject(result);
            },
            error: (error) => {
                reject(error);
            }
        })
      })
    }

    // -------------------------PRODUCT SERVICE-------------------------

    openProductImageSwapDialog(fileOptions: MatOption<string>[], width: string = '100%', disableClose: boolean = false) {
        return DialogUtils.openProductImageSwapDialog(this.matDialog, fileOptions, width, disableClose);
    }

    static openProductImageSwapDialog(matDialog: MatDialog, fileOptions: MatOption<string>[], width: string = '100%', disableClose: boolean = false) {
      return new Promise<ProductImageSwapDialogRespondData>((resolve, reject) => {
        let dialog = matDialog.open(ProductImageSwapDialog, {
            disableClose: disableClose,
            data: {
                fileOptions: fileOptions
            },
            width: width
        })

        dialog.afterClosed().subscribe({
            next: (result) => {
                if(result)
                    resolve(result);
                else
                    reject(result);
            },
            error: (error) => {
                reject(error);
            }
        })
      })
    }

    // -------------------------Dyanmic Object Dialog-------------------------

    static openDynamicObjectDialog(matDialog: MatDialog, object: any, width: string = '100%', disableClose: boolean = false) {
      //TODO
    }
}
