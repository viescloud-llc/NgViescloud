import { Observable } from "rxjs";

export enum FunctionType {
    OBSERVABLE = "OBSERVABLE",
    PROMISE = "PROMISE",
    RAW = "RAW",
    VOID = "VOID"
}

export class FunctionUtils {
    static getFunctionReturnType(fn: Function): FunctionType {
        const result = fn();
        if(result === undefined) {
            return FunctionType.VOID;
        }
        if(result instanceof Observable) {
            return FunctionType.OBSERVABLE;
        }
        else if(result instanceof Promise) {
            return FunctionType.PROMISE;
        }
        else {
            return FunctionType.RAW;
        }
    }

    private static applyAsyncFn<T>(fn: Observable<T> | Promise<T> | T): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            if(fn instanceof Observable) {
                return fn.subscribe({
                    next: res => {
                        resolve(res);
                    },
                    error: err => {
                        reject(err);
                    }
                });
            }
            else if(fn instanceof Promise) {
                return fn.then(res => {
                    resolve(res);
                })
                .catch(err => {
                    reject(err);
                });
            }
            else {
                return resolve(fn);
            }
        });
    } 

    private static applyRawFn<T>(fn: Function, applyObject: object): Promise<T> {
        const result = fn.bind(applyObject)();
        return new Promise<T>((resolve, reject) => {
            if(result instanceof Observable) {
                return result.subscribe({
                    next: res => {
                        resolve(res);
                    },
                    error: err => {
                        reject(err);
                    }
                });
            }
            else if(result instanceof Promise) {
                return result.then(res => {
                    resolve(res);
                })
                .catch(err => {
                    reject(err);
                });
            }
            else {
                return resolve(result);
            }
        });
    } 

    static applyAsync<T>(fn: Function | Observable<T> | Promise<T> | T, applyObject?: object): Promise<T> {
        if(typeof fn === "function") {
            return FunctionUtils.applyRawFn(fn, applyObject ?? {});
        }
        else {
            return FunctionUtils.applyAsyncFn(fn);
        }
    } 

    static applyObservable<T>(fn: Function | Observable<T> | Promise<T> | T, applyObject?: any): Observable<T> {
        if(typeof fn === "function") {
            return new Observable<T>(observer => {
                FunctionUtils.applyRawFn<T>(fn, applyObject ?? {}).then(res => {
                    observer.next(res);
                    observer.complete();
                })
                .catch(err => {
                    observer.error(err);
                });
            })
        }
        else {
            return new Observable<T>(observer => {
                FunctionUtils.applyAsyncFn<T>(fn).then(res => {
                    observer.next(res);
                    observer.complete();
                })
                .catch(err => {
                    observer.error(err);
                });
            })
        }
    } 
}