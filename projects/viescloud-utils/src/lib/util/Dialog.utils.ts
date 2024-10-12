import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { LoadingDialog } from "../dialog/loading-dialog/loading-dialog.component";

export class DialogUtils {
    private constructor() { }

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
}