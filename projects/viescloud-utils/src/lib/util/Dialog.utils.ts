import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { LoadingDialog } from "../dialog/loading-dialog/loading-dialog.component";
import { ConfirmDialog } from "../dialog/confirm-dialog/confirm-dialog.component";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class DialogUtils {

    constructor(public matDialog: MatDialog) {}

    openLoadingDialog(timeout?: number, disableClose: boolean = true) {
        DialogUtils.openLoadingDialog(this.matDialog, timeout, disableClose);
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

    openConfirmDialog(title: string, message: string, yes: string = 'Yes', no: string = 'No', width: string = '100%', disableClose: boolean = false) {
        DialogUtils.openConfirmDialog(this.matDialog, title, message, yes, no, width, disableClose);
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
}