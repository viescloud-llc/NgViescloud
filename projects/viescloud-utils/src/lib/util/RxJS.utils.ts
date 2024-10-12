import { MatDialog } from "@angular/material/dialog";
import { finalize, first, Observable, of, pipe, switchMap, tap } from "rxjs";
import { LoadingDialog } from "../dialog/loading-dialog/loading-dialog.component";
import { MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from "../model/Mat.model";
import { StringSnackBar } from "../snack/string-snack-bar/string-snack-bar.component";
import { MatSnackBar, MatSnackBarRef } from "@angular/material/snack-bar";

export class RxJSUtils {
    private constructor() { }

    static async ObservableToPromise<T>(observable: Observable<T>, nextFn?: (value: T) => void, errorFn?: (error: any) => void): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            observable.pipe(first()).subscribe({
                next: (v) => {
                    if (nextFn)
                        nextFn(v);
                    resolve(v);
                },
                error: (e) => {
                    if (errorFn)
                        errorFn(e);
                    reject(e);
                }
            })
        })
    }

    static waitLoadingSnackBar<T>(snackBar?: MatSnackBar, message: string = 'Loading...', action?: string, duration: number = -1, matSnackBarHorizontalPosition: MatSnackBarHorizontalPosition = MatSnackBarHorizontalPosition.RIGHT, matSnackBarVerticalPosition: MatSnackBarVerticalPosition = MatSnackBarVerticalPosition.BOTTOM) {
        if (snackBar) {
            let bar: MatSnackBarRef<any>;

            return pipe(
                RxJSUtils.startWithTap<T>(() => {
                    bar = RxJSUtils.openSnackBar(snackBar, message, action, duration, matSnackBarHorizontalPosition, matSnackBarVerticalPosition);
                }),
                finalize<T>(() => bar.dismiss()),
                first<T>()
            );
        }
        else {
            return pipe();
        }
    }

    static waitLoadingSnackBarDynamicString<T>(snackBar?: MatSnackBar, message: string = 'Loading...', maxLength: number = 40, action?: string, duration: number = -1, matSnackBarHorizontalPosition: MatSnackBarHorizontalPosition = MatSnackBarHorizontalPosition.RIGHT, matSnackBarVerticalPosition: MatSnackBarVerticalPosition = MatSnackBarVerticalPosition.BOTTOM) {
        if (snackBar) {
            let bar: MatSnackBarRef<any>;

            return pipe(
                RxJSUtils.startWithTap<T>(() => {
                    bar = RxJSUtils.openSnackBarDynamicString(snackBar, message, maxLength, action, duration, matSnackBarHorizontalPosition, matSnackBarVerticalPosition);
                }),
                finalize<T>(() => bar.dismiss()),
                first<T>()
            );
        }
        else {
            return pipe();
        }
    }

    static waitLoadingDialog<T>(matDialog?: MatDialog) {
        if (matDialog) {
            let dialog = matDialog.open(LoadingDialog, {
                disableClose: true
            });

            return pipe(
                RxJSUtils.startWithTap<T>(() => {
                    dialog.afterClosed().subscribe({
                        next: () => { }
                    })
                }),
                finalize<T>(() => dialog.close()),
                first<T>()
            );
        }
        else {
            return pipe();
        }
    }

    static openLoadingDialog(matDialog: MatDialog, timeout?: number) {
        let dialog = matDialog.open(LoadingDialog, {
            disableClose: true
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

    static startWithTap<T>(callback: () => void) {
        return (source: Observable<T>) =>
            of({}).pipe(tap(callback), switchMap((o) => source));
    }

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