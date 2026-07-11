import { WritableSignal } from "@angular/core";
import { catchError, Observable, throwError } from "rxjs";

// Small helper for the "optimistic UI" pattern called out in the manager intent
// (§ 7.4): apply a cheap change locally first; if the server call errors, roll
// back the local state and bubble the error.
//
// Use for status flips, sort-order reorderings, isPrimary toggles — anything where
// the user expects an instant response and a server round-trip is just confirmation.
// For heavy mutations (saving a full product graph) prefer a spinner + refetch on
// success instead.
export class OptimisticUpdate {

  /**
   * Apply `newValue` to the signal immediately; subscribe to `serverCall`; on error,
   * restore the original value and re-throw so the caller can show a toast.
   *
   * Returns the server call observable (with the rollback wired into its error path)
   * so the caller is in charge of subscribe / unsubscribe lifecycle.
   *
   * Example:
   *   OptimisticUpdate.apply(
   *     this.statusSignal,
   *     'PROCESSING',
   *     () => this.svc.patch(orderId, { status: 'PROCESSING' })
   *   ).subscribe({
   *     next:  saved => console.log('confirmed', saved),
   *     error: err   => toast.error(ErrorMapper.toMessage(ErrorMapper.map(err)))
   *   });
   */
  static apply<T, R>(
    signalRef: WritableSignal<T>,
    newValue: T,
    serverCall: () => Observable<R>
  ): Observable<R> {
    const previous = signalRef();
    signalRef.set(newValue);
    return serverCall().pipe(
      catchError(err => {
        signalRef.set(previous);
        return throwError(() => err);
      })
    );
  }

  /**
   * Generic variant for non-signal state. Pass `apply(value)` to write the new value
   * and `revert()` (no arg) to roll back. Useful when state lives in a `BehaviorSubject`,
   * a plain field, or a parent component you only have callbacks into.
   *
   * Example (BehaviorSubject):
   *   OptimisticUpdate.applyVia(
   *     v => this.subject$.next(v),                 // apply
   *     () => this.subject$.next(prev),             // revert
   *     newValue,
   *     () => this.svc.patch(id, partial)
   *   ).subscribe(...)
   */
  static applyVia<T, R>(
    apply: (value: T) => void,
    revert: () => void,
    newValue: T,
    serverCall: () => Observable<R>
  ): Observable<R> {
    apply(newValue);
    return serverCall().pipe(
      catchError(err => {
        revert();
        return throwError(() => err);
      })
    );
  }
}
