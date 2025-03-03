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

    static mergeObjects<T>(obj1: any, obj2: any): T {
        if (obj1 === null || obj2 === null) return obj1; // Return if either is null
        if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1; // Only merge if both are objects
    
        // Loop through keys in obj2
        for (const key in obj2) {
          if (obj2.hasOwnProperty(key)) {
            const value1 = obj1[key];
            const value2 = obj2[key];
    
            // If value2 is not null or undefined, apply it to obj1
            if (value2 !== null && value2 !== undefined) {
              // If both values are objects, merge recursively
              if (typeof value1 === 'object' && typeof value2 === 'object') {
                this.mergeObjects(value1, value2);
              } else {
                obj1[key] = value2;
              }
            }
          }
        }

        return obj1;
    }
}