import { MatDialog } from "@angular/material/dialog";
import { finalize, first, Observable, of, pipe, switchMap, tap } from "rxjs";
import { LoadingDialog } from "../dialog/loading-dialog/loading-dialog.component";
import { MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from "../model/mat.model";
import { MatSnackBar, MatSnackBarRef } from "@angular/material/snack-bar";
import { SnackBarUtils } from "./SnackBar.utils";
import { forwardRef, Inject, Injectable } from "@angular/core";
import { PopupUtils } from "./Popup.utils";
import { OverlayRef } from "@angular/cdk/overlay";
import { AuthenticatorService } from "../service/authenticator.service";
import { NotAuthenticatedError } from "../model/error.model";

@Injectable({
    providedIn: 'root'
})
export class RxJSUtils {

    constructor(
        public snackBar: MatSnackBar,
        public matDialog: MatDialog,
        public popupUtils: PopupUtils,
    ) { }

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

    waitLoadingSnackBar<T>(message: string = 'Loading...', action?: string, duration: number = -1, matSnackBarHorizontalPosition: MatSnackBarHorizontalPosition = MatSnackBarHorizontalPosition.RIGHT, matSnackBarVerticalPosition: MatSnackBarVerticalPosition = MatSnackBarVerticalPosition.BOTTOM) {
        return RxJSUtils.waitLoadingSnackBar<T>(this.snackBar, message, action, duration, matSnackBarHorizontalPosition, matSnackBarVerticalPosition);
    }

    static waitLoadingSnackBar<T>(snackBar?: MatSnackBar, message: string = 'Loading...', action?: string, duration: number = -1, matSnackBarHorizontalPosition: MatSnackBarHorizontalPosition = MatSnackBarHorizontalPosition.RIGHT, matSnackBarVerticalPosition: MatSnackBarVerticalPosition = MatSnackBarVerticalPosition.BOTTOM) {
        if (snackBar) {
            let bar: MatSnackBarRef<any>;

            return pipe(
                RxJSUtils.startWithTap<T>(() => {
                    bar = SnackBarUtils.openSnackBar(snackBar, message, action, duration, matSnackBarHorizontalPosition, matSnackBarVerticalPosition);
                }),
                finalize<T>(() => bar.dismiss()),
                first<T>()
            );
        }
        else {
            return pipe();
        }
    }

    waitLoadingDynamicStringSnackBar<T>(message: string = 'Loading...', maxLength: number = 40, action?: string, duration: number = -1, matSnackBarHorizontalPosition: MatSnackBarHorizontalPosition = MatSnackBarHorizontalPosition.RIGHT, matSnackBarVerticalPosition: MatSnackBarVerticalPosition = MatSnackBarVerticalPosition.BOTTOM) {
        return RxJSUtils.waitLoadingDynamicStringSnackBar<T>(this.snackBar, message, maxLength, action, duration, matSnackBarHorizontalPosition, matSnackBarVerticalPosition);
    }

    static waitLoadingDynamicStringSnackBar<T>(snackBar?: MatSnackBar, message: string = 'Loading...', maxLength: number = 40, action?: string, duration: number = -1, matSnackBarHorizontalPosition: MatSnackBarHorizontalPosition = MatSnackBarHorizontalPosition.RIGHT, matSnackBarVerticalPosition: MatSnackBarVerticalPosition = MatSnackBarVerticalPosition.BOTTOM) {
        if (snackBar) {
            let bar: MatSnackBarRef<any>;

            return pipe(
                RxJSUtils.startWithTap<T>(() => {
                    bar = SnackBarUtils.openSnackBarDynamicString(snackBar, message, maxLength, action, duration, matSnackBarHorizontalPosition, matSnackBarVerticalPosition);
                }),
                finalize<T>(() => bar.dismiss()),
                first<T>()
            );
        }
        else {
            return pipe();
        }
    }

    waitLoadingDialog<T>(disableClose: boolean = true) {
        return RxJSUtils.waitLoadingDialog<T>(this.matDialog, disableClose);
    }

    static waitLoadingDialog<T>(matDialog?: MatDialog, disableClose: boolean = true) {
        if (matDialog) {
            let dialog = matDialog.open(LoadingDialog, {
                disableClose: disableClose
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

    static startWithTap<T>(callback: () => void) {
        return (source: Observable<T>) =>
            of({}).pipe(tap(callback), switchMap((o) => source));
    }

    waitLoadingMessagePopup<T>(message: string, dismissLabel: string = '', vertical: 'top' | 'bottom' = 'bottom', horizontal: 'left' | 'middle' | 'right' = 'right') {
        let ref: OverlayRef;
        return pipe(
            RxJSUtils.startWithTap<T>(() => {
                ref = this.popupUtils.openMessagePopup(message, dismissLabel, vertical, horizontal, 0);
            }),
            finalize<T>(() => this.popupUtils.dismiss(ref)),
            first<T>()
        );
    }

    waitLoadingDynamicMessagePopup<T>(message: string, dismissLabel: string = '', maxLength: number = 40, vertical: 'top' | 'bottom' = 'bottom', horizontal: 'left' | 'middle' | 'right' = 'right') {
        let ref: OverlayRef;
        return pipe(
            RxJSUtils.startWithTap<T>(() => {
                ref = this.popupUtils.openDynamicMessagePopup(message, dismissLabel, maxLength, vertical, horizontal, 0);
            }),
            finalize<T>(() => this.popupUtils.dismiss(ref)),
            first<T>()
        );
    }
}