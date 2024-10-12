import { MatSnackBar } from "@angular/material/snack-bar";
import { StringSnackBar } from "../snack/string-snack-bar/string-snack-bar.component";
import { MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from "../model/Mat.model";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class SnackBarUtils {
    constructor(private snackBar: MatSnackBar) { }

    openSnackBar(message: string, action?: string, duration: number = 2000, matSnackBarHorizontalPosition: MatSnackBarHorizontalPosition = MatSnackBarHorizontalPosition.CENTER, matSnackBarVerticalPosition: MatSnackBarVerticalPosition = MatSnackBarVerticalPosition.BOTTOM) {
        SnackBarUtils.openSnackBar(this.snackBar, message, action, duration, matSnackBarHorizontalPosition, matSnackBarVerticalPosition);
    }

    static openSnackBar(snackBar: MatSnackBar, message: string, action?: string, duration: number = 2000, matSnackBarHorizontalPosition: MatSnackBarHorizontalPosition = MatSnackBarHorizontalPosition.CENTER, matSnackBarVerticalPosition: MatSnackBarVerticalPosition = MatSnackBarVerticalPosition.BOTTOM) {
        return snackBar.open(message, action, {
            duration: duration,
            horizontalPosition: matSnackBarHorizontalPosition,
            verticalPosition: matSnackBarVerticalPosition
        });
    }

    openSnackBarDynamicString(message: string, maxLength: number = 40, action?: string, duration: number = 2000, matSnackBarHorizontalPosition: MatSnackBarHorizontalPosition = MatSnackBarHorizontalPosition.CENTER, matSnackBarVerticalPosition: MatSnackBarVerticalPosition = MatSnackBarVerticalPosition.BOTTOM) {
        SnackBarUtils.openSnackBarDynamicString(this.snackBar, message, maxLength, action, duration, matSnackBarHorizontalPosition, matSnackBarVerticalPosition);
    }

    static openSnackBarDynamicString(snackBar: MatSnackBar, message: string, maxLength: number = 40, action?: string, duration: number = 2000, matSnackBarHorizontalPosition: MatSnackBarHorizontalPosition = MatSnackBarHorizontalPosition.CENTER, matSnackBarVerticalPosition: MatSnackBarVerticalPosition = MatSnackBarVerticalPosition.BOTTOM) {
        return snackBar.openFromComponent(StringSnackBar, {
            data: {
                message: message,
                maxLength: maxLength,
                dismissLabel: action,
                viewFullOnHover: true
            },
            duration: duration,
            horizontalPosition: matSnackBarHorizontalPosition,
            verticalPosition: matSnackBarVerticalPosition
        });
    }
}