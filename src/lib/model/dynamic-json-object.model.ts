import { signal, computed, Signal, WritableSignal, effect, EffectRef } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

type FieldType = 'primitive' | 'list' | 'object' | 'anything';
type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

interface PathSegment {
  key: string | number;
  isArrayIndex: boolean;
  isStringKey: boolean;
}

class DynamicJsonObject {
  private data: JsonValue = {};
  private changeSubject = new BehaviorSubject<DynamicJsonObject>(this);
  public readonly changes$: Observable<DynamicJsonObject> = this.changeSubject.asObservable();
  
  // Track bound signals and observables for cleanup
  private boundSignals = new Map<string, WritableSignal<JsonValue | undefined>>();
  private boundObservables = new Map<string, BehaviorSubject<JsonValue | undefined>>();
  private effectCleanups: (() => void)[] = [];

  constructor(initialData?: JsonValue) {
    if (initialData !== undefined) {
      this.data = this.deepClone(initialData);
    }
  }

  /**
   * Get a value at the specified path with type checking
   */
  get<T = JsonValue>(fieldType: FieldType, ...path: (string | number)[]): T | undefined {
    if (path.length === 0) {
      return this.validateFieldType(this.data, fieldType) ? (this.data as T) : undefined;
    }

    const value = this.getValueAtPath(path);
    return this.validateFieldType(value, fieldType) ? (value as T) : undefined;
  }

  /**
   * Get a bound signal for the specified path
   * The signal will automatically sync with the data at that path
   */
  getSignal<T extends JsonValue = JsonValue>(...path: (string | number)[]): WritableSignal<T | undefined> {
    const pathKey = this.getPathKey(path);
    
    // Return existing signal if it exists
    if (this.boundSignals.has(pathKey)) {
      return this.boundSignals.get(pathKey) as WritableSignal<T | undefined>;
    }

    // Create new bound signal
    const currentValue = this.getValueAtPath(path) as T | undefined;
    const boundSignal = signal<T | undefined>(currentValue);
    
    // Store reference with proper typing
    this.boundSignals.set(pathKey, boundSignal as WritableSignal<JsonValue | undefined>);

    // Create two-way binding
    this.createSignalBinding(boundSignal, path);

    return boundSignal;
  }

  /**
   * Get a bound BehaviorSubject for the specified path
   * The BehaviorSubject will automatically sync with the data at that path
   */
  getBehaviorSubject<T extends JsonValue = JsonValue>(...path: (string | number)[]): BehaviorSubject<T | undefined> {
    const pathKey = this.getPathKey(path);
    
    // Return existing BehaviorSubject if it exists
    if (this.boundObservables.has(pathKey)) {
      return this.boundObservables.get(pathKey) as BehaviorSubject<T | undefined>;
    }

    // Create new bound BehaviorSubject
    const currentValue = this.getValueAtPath(path) as T | undefined;
    const boundSubject = new BehaviorSubject<T | undefined>(currentValue);
    
    // Store reference with proper typing
    this.boundObservables.set(pathKey, boundSubject as BehaviorSubject<JsonValue | undefined>);

    // Create two-way binding
    this.createObservableBinding(boundSubject, path);

    return boundSubject;
  }

  /**
   * Get a computed signal that automatically updates when the path value changes
   */
  getComputed<T extends JsonValue = JsonValue>(computeFn: (value: JsonValue | undefined) => T, ...path: (string | number)[]): Signal<T> {
    const boundSignal = this.getSignal(...path);
    return computed(() => computeFn(boundSignal()));
  }

  /**
   * Get an observable for a specific path that emits when that path changes
   */
  getObservable<T extends JsonValue = JsonValue>(...path: (string | number)[]): Observable<T | undefined> {
    return this.changes$.pipe(
      map(() => this.getValueAtPath(path) as T | undefined),
      distinctUntilChanged()
    );
  }

  /**
   * Set a value at the specified path, creating intermediate objects/arrays as needed
   */
  set(value: JsonValue, ...path: (string | number)[]): boolean {
    if (path.length === 0) {
      this.data = value;
      this.notifyChange();
      this.updateBoundReactives();
      return true;
    }

    try {
      this.setValueAtPath(value, path);
      this.notifyChange();
      this.updateBoundReactive(path, value);
      return true;
    } catch (error) {
      console.warn(`Failed to set value at path [${path.join(', ')}]:`, error);
      return false;
    }
  }

  /**
   * Check if a path exists
   */
  has(...path: (string | number)[]): boolean {
    try {
      const value = this.getValueAtPath(path);
      return value !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Delete a value at the specified path
   */
  delete(...path: (string | number)[]): boolean {
    if (path.length === 0) {
      this.data = {};
      this.notifyChange();
      this.updateBoundReactives();
      return true;
    }

    try {
      const parentPath = path.slice(0, -1);
      const key = path[path.length - 1];
      const parent = parentPath.length > 0 ? this.getValueAtPath(parentPath) : this.data;

      if (this.isObject(parent)) {
        delete parent[String(key)];
        this.notifyChange();
        this.updateBoundReactive(path, undefined);
        return true;
      } else if (Array.isArray(parent) && typeof key === 'number') {
        parent.splice(key, 1);
        this.notifyChange();
        this.updateBoundReactives(); // Array indices may have shifted
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get all keys at the specified path
   */
  keys(...path: (string | number)[]): string[] | number[] | undefined {
    const value = path.length > 0 ? this.getValueAtPath(path) : this.data;
    
    if (this.isObject(value)) {
      return Object.keys(value);
    } else if (Array.isArray(value)) {
      return value.map((_, index) => index);
    }
    return undefined;
  }

  /**
   * Get the type of value at the specified path
   */
  getType(...path: (string | number)[]): string {
    const value = path.length > 0 ? this.getValueAtPath(path) : this.data;
    
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return typeof value;
  }

  /**
   * Merge another object into this one at the specified path
   */
  merge(other: JsonValue, ...path: (string | number)[]): boolean {
    try {
      const target = path.length > 0 ? this.getValueAtPath(path) : this.data;
      
      if (this.isObject(target) && this.isObject(other)) {
        const merged = { ...target, ...other };
        if (path.length > 0) {
          this.setValueAtPath(merged, path);
        } else {
          this.data = merged;
        }
        this.notifyChange();
        this.updateBoundReactives();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Convert to JSON string
   */
  toJson(pretty: boolean = false): string {
    return JSON.stringify(this.data, null, pretty ? 2 : undefined);
  }

  /**
   * Load from JSON string
   */
  fromJson(json: string): boolean {
    try {
      this.data = JSON.parse(json);
      this.notifyChange();
      this.updateBoundReactives();
      return true;
    } catch (error) {
      console.warn('Failed to parse JSON:', error);
      return false;
    }
  }

  /**
   * Get the raw data object
   */
  toObject(): JsonValue {
    return this.deepClone(this.data);
  }

  /**
   * Load from object
   */
  fromObject(obj: JsonValue): void {
    this.data = this.deepClone(obj);
    this.notifyChange();
    this.updateBoundReactives();
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.data = {};
    this.notifyChange();
    this.updateBoundReactives();
  }

  /**
   * Clone this instance (note: bound signals/observables are not cloned)
   */
  clone(): DynamicJsonObject {
    return new DynamicJsonObject(this.data);
  }

  /**
   * Get all paths in the object as an array of path arrays
   */
  getAllPaths(): (string | number)[][] {
    const paths: (string | number)[][] = [];
    
    const traverse = (obj: JsonValue, currentPath: (string | number)[] = []) => {
      if (this.isObject(obj)) {
        for (const [key, value] of Object.entries(obj)) {
          const newPath = [...currentPath, key];
          paths.push([...newPath]);
          traverse(value, newPath);
        }
      } else if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          const newPath = [...currentPath, i];
          paths.push([...newPath]);
          traverse(obj[i], newPath);
        }
      }
    };

    traverse(this.data);
    return paths;
  }

  /**
   * Get all bound signals and observables for debugging
   */
  getBoundReactives(): { signals: string[], observables: string[] } {
    return {
      signals: Array.from(this.boundSignals.keys()),
      observables: Array.from(this.boundObservables.keys())
    };
  }

  /**
   * Dispose of all bound signals, observables and clean up resources
   */
  dispose(): void {
    // Complete all observables
    this.boundObservables.forEach(subject => subject.complete());
    this.boundObservables.clear();
    
    // Clear signals
    this.boundSignals.clear();
    
    // Clean up effects
    this.effectCleanups.forEach(cleanup => cleanup());
    this.effectCleanups = [];
    
    // Complete change subject
    this.changeSubject.complete();
  }

  /**
   * Create two-way binding for signal
   */
  private createSignalBinding<T extends JsonValue>(signal: WritableSignal<T | undefined>, path: (string | number)[]): void {
    // Effect to update data when signal changes
    const effectRef: EffectRef = effect(() => {
      const signalValue = signal();
      const currentDataValue = this.getValueAtPath(path);
      
      // Only update if values are different to avoid infinite loops
      if (!this.deepEqual(signalValue, currentDataValue)) {
        if (signalValue !== undefined) {
          this.setValueAtPath(signalValue, path);
        } else {
          this.delete(...path);
        }
        this.notifyChange();
      }
    });
    
    // Store cleanup function that calls destroy on the effect
    this.effectCleanups.push(() => effectRef.destroy());
  }

  /**
   * Create two-way binding for BehaviorSubject
   */
  private createObservableBinding<T extends JsonValue>(subject: BehaviorSubject<T | undefined>, path: (string | number)[]): void {
    // Subscribe to subject changes to update data
    const subscription = subject.subscribe(subjectValue => {
      const currentDataValue = this.getValueAtPath(path);
      
      // Only update if values are different to avoid infinite loops
      if (!this.deepEqual(subjectValue, currentDataValue)) {
        if (subjectValue !== undefined) {
          this.setValueAtPath(subjectValue, path);
        } else {
          this.delete(...path);
        }
        this.notifyChange();
      }
    });

    // Clean up subscription when disposed
    this.effectCleanups.push(() => subscription.unsubscribe());
  }

  /**
   * Update a specific bound reactive when data changes
   */
  private updateBoundReactive(path: (string | number)[], newValue: JsonValue | undefined): void {
    const pathKey = this.getPathKey(path);
    
    // Update bound signal
    const boundSignal = this.boundSignals.get(pathKey);
    if (boundSignal && !this.deepEqual(boundSignal(), newValue)) {
      boundSignal.set(newValue);
    }
    
    // Update bound observable
    const boundObservable = this.boundObservables.get(pathKey);
    if (boundObservable && !this.deepEqual(boundObservable.value, newValue)) {
      boundObservable.next(newValue);
    }
  }

  /**
   * Update all bound reactives when data structure changes significantly
   */
  private updateBoundReactives(): void {
    // Update all bound signals
    this.boundSignals.forEach((signal, pathKey) => {
      const path = this.parsePathKey(pathKey);
      const currentValue = this.getValueAtPath(path);
      if (!this.deepEqual(signal(), currentValue)) {
        signal.set(currentValue);
      }
    });

    // Update all bound observables
    this.boundObservables.forEach((subject, pathKey) => {
      const path = this.parsePathKey(pathKey);
      const currentValue = this.getValueAtPath(path);
      if (!this.deepEqual(subject.value, currentValue)) {
        subject.next(currentValue);
      }
    });
  }

  /**
   * Generate a unique key for a path
   */
  private getPathKey(path: (string | number)[]): string {
    return JSON.stringify(path);
  }

  /**
   * Parse a path key back to path array
   */
  private parsePathKey(pathKey: string): (string | number)[] {
    return JSON.parse(pathKey);
  }

  /**
   * Deep equality check
   */
  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a !== typeof b) return false;
    
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, i) => this.deepEqual(val, b[i]));
    }
    
    if (typeof a === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(key => this.deepEqual(a[key], b[key]));
    }
    
    return false;
  }

  /**
   * Validate field type against actual value
   */
  private validateFieldType(value: JsonValue | undefined, fieldType: FieldType): boolean {
    if (fieldType === 'anything') return true;
    if (value === undefined) return false;

    switch (fieldType) {
      case 'primitive':
        return typeof value !== 'object' || value === null;
      case 'list':
        return Array.isArray(value);
      case 'object':
        return this.isObject(value);
      default:
        return true;
    }
  }

  /**
   * Parse path segments to handle array indices and object keys
   */
  private parsePath(path: (string | number)[]): PathSegment[] {
    const segments: PathSegment[] = [];
    
    for (const segment of path) {
      if (typeof segment === 'number') {
        segments.push({
          key: segment,
          isArrayIndex: true,
          isStringKey: false
        });
      } else if (typeof segment === 'string') {
        const arrayMatch = segment.match(/^(.+)\[([^\]]+)\]$/);
        if (arrayMatch) {
          const [, baseKey, indexStr] = arrayMatch;
          segments.push({
            key: baseKey,
            isArrayIndex: false,
            isStringKey: true
          });
          
          const numericIndex = parseInt(indexStr, 10);
          if (!isNaN(numericIndex) && indexStr === numericIndex.toString()) {
            segments.push({
              key: numericIndex,
              isArrayIndex: true,
              isStringKey: false
            });
          } else {
            const cleanIndex = indexStr.replace(/^['"]|['"]$/g, '');
            segments.push({
              key: cleanIndex,
              isArrayIndex: false,
              isStringKey: true
            });
          }
        } else {
          segments.push({
            key: segment,
            isArrayIndex: false,
            isStringKey: true
          });
        }
      }
    }
    
    return segments;
  }

  /**
   * Get value at path with proper error handling
   */
  private getValueAtPath(path: (string | number)[]): JsonValue | undefined {
    const segments = this.parsePath(path);
    let current: JsonValue = this.data;

    for (const segment of segments) {
      if (segment.isArrayIndex && Array.isArray(current)) {
        const index = segment.key as number;
        if (index < 0 || index >= current.length) {
          return undefined;
        }
        current = current[index];
      } else if (!segment.isArrayIndex && this.isObject(current)) {
        const key = String(segment.key);
        current = current[key];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Set value at path, creating intermediate structures
   */
  private setValueAtPath(value: JsonValue, path: (string | number)[]): void {
    const segments = this.parsePath(path);
    let current: JsonValue = this.data;

    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      const nextSegment = segments[i + 1];

      if (segment.isArrayIndex && Array.isArray(current)) {
        const index = segment.key as number;
        while (current.length <= index) {
          current.push(null);
        }
        
        if (current[index] === null || current[index] === undefined) {
          current[index] = nextSegment.isArrayIndex ? [] : {};
        }
        current = current[index];
      } else if (!segment.isArrayIndex) {
        if (!this.isObject(current)) {
          throw new Error(`Cannot set property on non-object at path segment: ${segment.key}`);
        }
        
        const key = String(segment.key);
        if (!(key in current)) {
          current[key] = nextSegment.isArrayIndex ? [] : {};
        }
        current = current[key];
      } else {
        throw new Error(`Invalid path structure at segment: ${segment.key}`);
      }
    }

    const lastSegment = segments[segments.length - 1];
    if (lastSegment.isArrayIndex && Array.isArray(current)) {
      const index = lastSegment.key as number;
      while (current.length <= index) {
        current.push(null);
      }
      current[index] = value;
    } else if (!lastSegment.isArrayIndex && this.isObject(current)) {
      const key = String(lastSegment.key);
      current[key] = value;
    } else {
      throw new Error(`Cannot set value at final path segment: ${lastSegment.key}`);
    }
  }

  /**
   * Type guard for objects
   */
  private isObject(value: JsonValue | undefined): value is JsonObject {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * Deep clone utility
   */
  private deepClone(obj: JsonValue): JsonValue {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item));
    }

    const cloned: JsonObject = {};
    for (const [key, value] of Object.entries(obj)) {
      cloned[key] = this.deepClone(value);
    }
    return cloned;
  }

  /**
   * Notify change subscribers
   */
  private notifyChange(): void {
    this.changeSubject.next(this);
  }
}

export default DynamicJsonObject;