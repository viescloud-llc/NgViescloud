import { Observable } from "rxjs";

export class ReflectionUtils {
    private constructor() { }

    static fixPrototype<T>(classEntity: any) {
        return <T>(source: Observable<T>): Observable<T> => {
            return new Observable(subscriber => {
                source.subscribe({
                    next(value) {
                        if (value !== undefined && value !== null) {
                            Object.setPrototypeOf(value, classEntity.prototype);
                        }
                        subscriber.next(value);
                    },
                    error(error) {
                        subscriber.error(error);
                    },
                    complete() {
                        subscriber.complete();
                    }
                })
            });
        };
    }

    static createObject<T>(_createClass: { new(): T }): T {
        return new _createClass();
    }

    static setField(obj: Object, fieldName: string, value: any) {
        Object.defineProperty(obj, fieldName, {
            value: value,
            writable: true,
            enumerable: true,
            configurable: true
        });
    }

    static copyAllParentPrototype<T>(obj: T): T {
        let prototype = Object.getPrototypeOf(obj);
        let parentPrototype = Object.getPrototypeOf(prototype);
        for(const [key, value] of Object.entries(parentPrototype)) {
            prototype[key] = value;
        }
        return obj;
    }
}