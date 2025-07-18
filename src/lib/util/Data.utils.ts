import { MatItemSettingType, MatOption } from "../model/mat.model";
import { ReflectionUtils } from "./Reflection.utils";

export class DataUtils {
  private constructor() { }

  static isSimpleNotEqual(obj1: any, obj2: any) {
    return !DataUtils.isSimpleEqual(obj1, obj2);
  }

  static isSimpleEqual(obj1: any, obj2: any) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  static isNotEqual(obj1: any, obj2: any) {
    return !DataUtils.isEqual(obj1, obj2);
  }

  static isEqual<T>(obj1: T, obj2: T): boolean {
    // If both references are the same, return true
    if (obj1 === obj2) return true;

    if (JSON.stringify(obj1) === JSON.stringify(obj2))
        return true

    // If the types are different, return false
    if (typeof obj1 !== typeof obj2) return false;

    // Handle null or undefined values
    if (obj1 === null || obj2 === null || obj1 === undefined || obj2 === undefined) return false;

    // Handle primitive type values directly
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2;

    // For arrays, compare each element using a default empty array as a template
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
        // If array lengths differ, return false
        if (obj1.length !== obj2.length) return false;

        // Compare each element recursively
        return obj1.every((item, index) => DataUtils.isEqual(item, obj2[index]));
    }

    // For objects, collect keys from both obj1 and obj2
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    // Create a set to store all keys for comparison
    const allKeys = new Set([...keys1, ...keys2]);

    for (const key of allKeys) {
        const value1 = (obj1 as any)[key];
        const value2 = (obj2 as any)[key];

        // Handle missing fields
        const isValue1Missing = value1 === undefined || value1 === null;
        const isValue2Missing = value2 === undefined || value2 === null;

        // Skip if both are missing or if one is missing and the other is a default value
        if ((isValue1Missing && isValue2Missing) ||
            (isValue1Missing && DataUtils.isDefaultValue(value2, undefined)) ||
            (isValue2Missing && DataUtils.isDefaultValue(value1, undefined))) {
            continue;
        }

        // If obj1 is missing but obj2 has a valid value, do not skip comparison
        if (isValue1Missing && !DataUtils.isDefaultValue(value2, undefined)) {
            return false; // They are not equal because obj2 has a valid value
        }

        // If obj2 is missing but obj1 has a valid value, do not skip comparison
        if (isValue2Missing && !DataUtils.isDefaultValue(value1, undefined)) {
            return false; // They are not equal because obj1 has a valid value
        }

        // Compare recursively if both values exist and are not default values
        if (!DataUtils.isEqual(value1, value2)) return false;
    }

    return true;
  }

  static isNotEqualWith<T>(obj1: T, obj2: T, blankObj: T): boolean {
    return !DataUtils.isEqualWith(obj1, obj2, blankObj);
  }

  static isEqualWith<T>(obj1: T, obj2: T, blankObj: T): boolean {
    // If both references are the same, return true
    if (obj1 === obj2) return true;

    if (JSON.stringify(obj1) === JSON.stringify(obj2))
        return true

    // If the types are different, return false
    if (typeof obj1 !== typeof obj2) return false;

    // Handle null or undefined values
    if (obj1 === null || obj2 === null || obj1 === undefined || obj2 === undefined) return false;

    // Handle primitive type values directly
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2;

    // For arrays, compare each element using the first item in the blankObj array as a template
    if (Array.isArray(blankObj)) {
        if (!Array.isArray(obj1) || !Array.isArray(obj2)) return false;

        // If array lengths differ, return false
        if (obj1.length !== obj2.length) return false;

        // Compare each element recursively
        const blankItem = blankObj[0];
        return obj1.every((item, index) => DataUtils.isEqualWith(item, obj2[index], blankItem));
    }

    // For objects, iterate through the keys of blankObj as the model
    if (typeof blankObj === 'object' && blankObj !== null) {
        const blankKeys = Object.keys(blankObj);

        for (const key of blankKeys) {
            const blankValue = (blankObj as any)[key];
            const value1 = (obj1 as any)[key];
            const value2 = (obj2 as any)[key];

            // Handle missing fields differently based on your updated logic
            const isValue1Missing = value1 === undefined;
            const isValue2Missing = value2 === undefined;
            const isValue1Default = DataUtils.isDefaultValue(value1, blankValue);
            const isValue2Default = DataUtils.isDefaultValue(value2, blankValue);

            // Skip if both are missing or if one is missing and the other is a default value
            if ((isValue1Missing && isValue2Missing) ||
                (isValue1Missing && isValue2Default) ||
                (isValue2Missing && isValue1Default)) {
                continue;
            }

            // If obj1 is missing but obj2 has a valid value, do not skip comparison
            if (isValue1Missing && !isValue2Default) {
                return false; // They are not equal because obj2 has a valid value
            }

            // If obj2 is missing but obj1 has a valid value, do not skip comparison
            if (isValue2Missing && !isValue1Default) {
                return false; // They are not equal because obj1 has a valid value
            }

            // Compare recursively if both values exist and are not default values
            if (!DataUtils.isEqualWith(value1, value2, blankValue)) return false;
        }
        return true;
    }

    return false;
  }

  static isDefaultValue(value: any, blankValue: any): boolean {
    // Check for strict equality with blankValue
    if (value === blankValue) return true;

    // Check for null or undefined values
    if (value === null || value === undefined) return true;

    // Check for empty strings specifically
    if (typeof value === 'string' && value.trim() === '') return true;

    // For arrays, check if empty or matches blank array
    if (Array.isArray(value) && Array.isArray(blankValue)) {
        return value.length === 0 || DataUtils.isEqualWith(value, blankValue, blankValue);
    }

    // For objects, check if all keys match the blank value
    if (typeof value === 'object' && typeof blankValue === 'object') {
        return DataUtils.isEqualWith(value, blankValue, blankValue);
    }

    // If none of the above, it's not a default value
    return false;
  }

  static areAllObjectsEqual<T>(objects: T[]): boolean {
    if (objects.length <= 1) {
        return true;
    }
    const firstObj = objects[0];
    return objects.every(obj => DataUtils.isEqual(firstObj, obj));
  }

  static areAllObjectsEqualWith<T>(objects: T[], blankValue: T): boolean {
    if (objects.length <= 1) {
        return true;
    }
    const firstObj = objects[0];
    return objects.every(obj => DataUtils.isEqualWith(firstObj, obj, blankValue));
  }

  static areAllObjectsEqualBy<T>(objects: T[], getCompareObj: (obj: T) => any): boolean {
    if (objects.length <= 1) {
        return true;
    }

    const firstObj = getCompareObj(objects[0]);
    return objects.every(obj => DataUtils.isEqual(firstObj, getCompareObj(obj)));
  }

  static hasValueWithExactCountBy<T>(objects: T[], getCompareObj: (obj: T) => any, value: any, count: number): boolean {
    const occurrences = DataUtils.getOccurrences(objects, getCompareObj, (obj: any) => DataUtils.isEqual(obj, value));
    return occurrences === count;
  }

  static hasValueWithLessCountBy<T>(objects: T[], getCompareObj: (obj: T) => any, value: any, count: number): boolean {
    const occurrences = DataUtils.getOccurrences(objects, getCompareObj, (obj: any) => DataUtils.isEqual(obj, value));
    return occurrences < count;
  }

  static hasValueWithLessOrEqualCountBy<T>(objects: T[], getCompareObj: (obj: T) => any, value: any, count: number): boolean {
    const occurrences = DataUtils.getOccurrences(objects, getCompareObj, (obj: any) => DataUtils.isEqual(obj, value));
    return occurrences <= count;
  }

  static hasValueWithMoreCountBy<T>(objects: T[], getCompareObj: (obj: T) => any, value: any, count: number): boolean {
    const occurrences = DataUtils.getOccurrences(objects, getCompareObj, (obj: any) => DataUtils.isEqual(obj, value));
    return occurrences > count;
  }

  static hasValueWithMoreOrEqualCountBy<T>(objects: T[], getCompareObj: (obj: T) => any, value: any, count: number): boolean {
  const occurrences = DataUtils.getOccurrences(objects, getCompareObj, (obj: any) => DataUtils.isEqual(obj, value));
  return occurrences >= count;
  }

  static hasValueCompareWithExactCountBy<T, U>(objects: T[], getCompareObj: (obj: T) => U, compareFn: (obj: U) => boolean, count: number): boolean {
    const occurrences = DataUtils.getOccurrences(objects, getCompareObj, compareFn);
    return occurrences === count;
  }

  static hasValueCompareWithLessCountBy<T, U>(objects: T[], getCompareObj: (obj: T) => U, compareFn: (obj: U) => boolean, count: number): boolean {
    const occurrences = DataUtils.getOccurrences(objects, getCompareObj, compareFn);
    return occurrences < count;
  }

  static hasValueCompareWithLessOrEqualCountBy<T, U>(objects: T[], getCompareObj: (obj: T) => U, compareFn: (obj: U) => boolean, count: number): boolean {
    const occurrences = DataUtils.getOccurrences(objects, getCompareObj, compareFn);
    return occurrences <= count;
  }

  static hasValueCompareWithMoreCountBy<T, U>(objects: T[], getCompareObj: (obj: T) => U, compareFn: (obj: U) => boolean, count: number): boolean {
    const occurrences = DataUtils.getOccurrences(objects, getCompareObj, compareFn);
    return occurrences > count;
  }

  static hasValueCompareWithMoreOrEqualCountBy<T, U>(objects: T[], getCompareObj: (obj: T) => U, compareFn: (obj: U) => boolean, count: number): boolean {
    const occurrences = DataUtils.getOccurrences(objects, getCompareObj, compareFn);
    return occurrences >= count;
  }

  static getOccurrences<T, U>(objects: T[], getCompareObj: (obj: T) => U, compareFn: (obj: U) => boolean): number {
    return objects.reduce((acc, obj) => {
        if (compareFn(getCompareObj(obj))) {
            return acc + 1;
        }
        return acc;
    }, 0);
  }

  static isEnum(obj: any): boolean {
    return typeof obj === "object" && Object.keys(obj).length > 0 && Object.values(obj).every(val => {
        return typeof val === 'string' || typeof val === 'number';
    });
  }

  static getEnumValues(enumObj: any): (string | number)[] {
    if (DataUtils.isEnum(enumObj)) {
        let arr: (string | number)[] = [];
        Object.values(enumObj)
        .filter(value => isNaN(Number(value)))
        .forEach(value => {
            if (typeof value === "string" || typeof value === "number") {
                arr.push(value);
            }
        })
        return arr;
    }
    return [];
  }

  static getEnumKeys(enumObj: any): (string | number)[] {
    if (DataUtils.isEnum(enumObj)) {
        let arr: (string | number)[] = [];
        Object.keys(enumObj)
        .filter(key => isNaN(Number(key)))
        .forEach(key => {
            if (typeof key === "string" || typeof key === "number") {
                arr.push(key);
            }
        })
        return arr;
    }
    return [];
  }

  static getEnumMap(enumType: object): Map<string, number> {
    const enumMap = new Map<string, number>();
  
    // Iterate over the keys of the enum
    Object.keys(enumType)
      .filter(key => isNaN(Number(key)))  // Filter out the reverse mappings (numeric keys)
      .forEach(key => {
        const value = enumType[key as keyof typeof enumType]; // Get the enum value
        enumMap.set(key, value); // Add to the map (key -> value)
      });
  
    return enumMap;
  }

  static getEnumMatOptions(Enum: any): MatOption<any>[] {
    let matOptions: MatOption<any>[] = [];
    DataUtils.getEnumValues(Enum).forEach(e => {
        matOptions.push({
            value: e,
            valueLabel: e.toString()
        })
    })

    return matOptions;
  }

  /**
   * Recursively purges the contents of an array or object.
   *
   * If the input is an array, it is replaced with an empty array.
   * If the input is an object, each of its fields is purged recursively.
   *
   * @param obj - The array or object to purge.
   * @returns The purged array or object, or the original input if it is neither.
   */
  static purgeArray<T>(obj: T): T {
    if (Array.isArray(obj)) {
        // If it's an array, set it to an empty array and return
        return [] as unknown as T;
    } else if (obj && typeof obj === 'object') {
        // If it's an object, recursively purge each field
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                obj[key] = this.purgeArray(obj[key]);
            }
        }
        return obj;
    }
    // Return the original object if it's neither an array nor an object
    return obj;
  }

  static purgeObject<T extends Object>(obj: T): T {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        delete obj[key];
      }
    }
    return obj;
  }

  /**
   * Purge the object value by deleting all of its properties, and then
   * check if the object has a prototype with a matching property name
   * with the suffix of MatItemSettingType.RECORD, if true, set the property
   * with an empty object.
   * @param obj the object to purge
   * @returns the purged object
   */
  static purgeValue<T extends Object>(obj: T): T {
    obj = DataUtils.purgeArray(obj);
    let keys = Object.keys(obj);
    let prototype = Object.getPrototypeOf(obj);

    for (const key of keys) {
      let name = key + MatItemSettingType.RECORD.toString();
      if (Object.hasOwn(prototype, name)) {
        ReflectionUtils.setField(obj, key, {});
        break;
      }
    }

    return obj;
  }

  static isInstanceOf<T>(obj: unknown, type: { new (...args: any[]): T } | Record<string, any>): boolean {
    if (type instanceof Function) {
      // Check if obj is an instance of the class constructor
      return obj instanceof type;
    } else if (typeof type === 'object' && type !== null && typeof obj === 'object' && obj !== null) {
      // Check if obj matches the structure of type
      return Object.keys(type).every(key => key in obj);
    }
    return false;
  }

  static async generateSha256(json: object): Promise<string> {
    const jsonString = JSON.stringify(json, Object.keys(json).sort());
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonString);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }
}
