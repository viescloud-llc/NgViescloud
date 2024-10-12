import { MatSnackBar } from "@angular/material/snack-bar";
import { StringSnackBar } from "../snack/string-snack-bar/string-snack-bar.component";
import { MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from "../model/Mat.model";

export class SnackBarUtils {
    private constructor() { }

    static openSnackBar(snackBar: MatSnackBar, message: string, action?: string, duration: number = 2000, matSnackBarHorizontalPosition: MatSnackBarHorizontalPosition = MatSnackBarHorizontalPosition.CENTER, matSnackBarVerticalPosition: MatSnackBarVerticalPosition = MatSnackBarVerticalPosition.BOTTOM) {
        return snackBar.open(message, action, {
            duration: duration,
            horizontalPosition: matSnackBarHorizontalPosition,
            verticalPosition: matSnackBarVerticalPosition
        });
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