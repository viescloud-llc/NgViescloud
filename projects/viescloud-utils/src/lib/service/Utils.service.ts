import { Injectable, Type, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Observable, finalize, first, of, pipe, switchMap, tap } from 'rxjs';
import { LoadingDialog } from '../dialog/loading-dialog/loading-dialog.component';
import { MatOption, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '../model/Mat.model';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { StringSnackBar } from '../snack/string-snack-bar/string-snack-bar.component';

export interface VFile {
  name: string,
  type: string,
  extension: string,
  rawFile?: globalThis.File | Blob;
  originalLink?: string;
  value: string;
}

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }

  static async getRouteParam(route: ActivatedRoute, variable: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      route.params.pipe(first()).subscribe(
        params => {
          let value = params[variable];
          resolve(value);
        },
        error => { reject('') }
      );
    })
  }

  patch(object: any, target: any): void {
    if (typeof object !== typeof target || JSON.stringify(object) !== JSON.stringify(target))
      return;

    if (typeof object === 'object') {

    }
    else {

    }
  }

  static async fetchAsVFile(uri: string): Promise<VFile> {
    try {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }

      let contentType = response.headers.get('Content-Type');
      let extension = '';
      let fileName = uri.substring(uri.lastIndexOf('/') + 1);

      if (!contentType) {
        // If Content-Type is not provided, derive it from the file name
        const fileName = uri.substring(uri.lastIndexOf('/') + 1);
        extension = fileName.split('.').pop()?.toLowerCase() || '';
        contentType = this.mapExtensionToContentType(extension);
      } else {
        // If Content-Type is provided, extract extension from it
        extension = contentType.split('/')[1];
      }

      const blob = await response.blob();

      const vFile: VFile = {
        name: uri.substring(uri.lastIndexOf('/') + 1), // Use filename from URI
        type: contentType,
        extension: extension,
        rawFile: blob,
        originalLink: uri,
        value: ''
      };

      return vFile;
    } catch (error) {
      throw error;
    }
  }

  // Helper method to map file extensions to MIME types
  static mapExtensionToContentType(extension: string): string {
    const extensionMap: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'zip': 'application/zip',
      // Add more mappings as needed
    };

    return extensionMap[extension] || 'application/octet-stream'; // Default type if not found
  }

  static async resizeVideo(file: File, resolution: '1080p' | '720p' | '480p' | '360p'): Promise<string> {
    const resolutions = {
      '1080p': { width: 1920, height: 1080 },
      '720p': { width: 1280, height: 720 },
      '480p': { width: 854, height: 480 },
      '360p': { width: 640, height: 360 },
    };

    const targetResolution = resolutions[resolution];
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context is not available');
    }

    video.src = URL.createObjectURL(file);

    return new Promise((resolve, reject) => {
      video.onloadeddata = () => {
        canvas.width = targetResolution.width;
        canvas.height = targetResolution.height;

        const stream = canvas.captureStream();
        const mediaRecorder = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/mp4' });
          resolve(URL.createObjectURL(blob));
        };

        mediaRecorder.start();

        video.play();
        video.ontimeupdate = () => {
          if (video.currentTime > 0.1) { // Ensure we capture some frames
            ctx.drawImage(video, 0, 0, targetResolution.width, targetResolution.height);
            video.pause();
            mediaRecorder.stop();
          }
        };

        video.onerror = (error) => {
          reject(error);
        };
      };
    });
  }

  static resizeImage(file: File | Blob, resolution: '1080p' | '720p' | '480p' | '360p'): Promise<string> {
    const resolutions = {
      '1080p': { width: 1920, height: 1080 },
      '720p': { width: 1280, height: 720 },
      '480p': { width: 854, height: 480 },
      '360p': { width: 640, height: 360 },
    };

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject('Canvas context is not available');
          return;
        }

        const targetResolution = resolutions[resolution];
        canvas.width = targetResolution.width;
        canvas.height = targetResolution.height;

        const widthRatio = targetResolution.width / img.width;
        const heightRatio = targetResolution.height / img.height;
        const ratio = Math.min(widthRatio, heightRatio);

        const newWidth = img.width * ratio;
        const newHeight = img.height * ratio;

        const xOffset = (targetResolution.width - newWidth) / 2;
        const yOffset = (targetResolution.height - newHeight) / 2;

        ctx.drawImage(img, 0, 0, img.width, img.height, xOffset, yOffset, newWidth, newHeight);

        canvas.toBlob(blob => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject('Canvas blob is null');
          }
        }, 'image/jpeg');
      };

      img.onerror = reject;
    });
  }

  saveFile(fileName: string, fileType: string, fileContent: string) {
    const file = new Blob([fileContent], { type: fileType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = fileName;
    link.click();
    link.remove();
  }

  async uploadFile(accept: string): Promise<VFile> {
    return UtilsService.uploadFileAsVFile(accept);
  }

  static async uploadFileAsVFile(accept: string): Promise<VFile> {
    return new Promise<VFile>((resolve, reject) => {
      let fileInput = document.createElement("input");
      fileInput.accept = accept;
      fileInput.type = 'file';
      fileInput.click();

      fileInput.onchange = (e) => {
        let rawFile = fileInput.files![0];
        let fileName = rawFile.name;
        let fileType = rawFile.type;
        let lastIndex = fileName.lastIndexOf('.') > 0 ? fileName.lastIndexOf('.') + 1 : fileName.length;
        let extension = fileName.substring(lastIndex);

        let reader = new FileReader();

        reader.onload = () => {
          let value: string = reader.result && typeof reader.result === 'string' ? reader.result : '';
          let file: VFile = {
            name: fileName,
            type: fileType,
            rawFile: rawFile,
            value: value,
            extension: extension
          }

          fileInput.remove();
          resolve(file);
        };
        reader.readAsText(rawFile);
      };
    });
  }

  static isNotEqual(obj1: any, obj2: any) {
    return !UtilsService.areObjectsEqual(obj1, obj2);
  }

  static isEqual(obj1: any, obj2: any) {
    return JSON.stringify(obj1) === JSON.stringify(obj2) || UtilsService.areObjectsEqual(obj1, obj2);
  }

   /**
   * Compares two objects and returns true if all their fields are the same, except for default values.
   * The default value is auto-detected based on the field's data type.
   * @param obj1 - The first object to compare.
   * @param obj2 - The second object to compare.
   * @returns True if the objects are equal (ignoring default values), false otherwise.
   */
   static areObjectsEqual(obj1: any, obj2: any): boolean {
    // Check if both arguments are objects
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
      return obj1 === obj2;
    }

    // Get the keys of both objects
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    // Check if they have the same number of keys
    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      const value1 = obj1[key];
      const value2 = obj2[key];

      // Detect default value based on type
      const defaultValue1 = UtilsService.getDefaultValue(value1);
      const defaultValue2 = UtilsService.getDefaultValue(value2);

      // Skip default values in both objects
      const isDefaultValue1 = value1 === defaultValue1;
      const isDefaultValue2 = value2 === defaultValue2;

      if (isDefaultValue1 && isDefaultValue2) {
        continue;
      }

      // Compare arrays recursively
      const areArrays = Array.isArray(value1) && Array.isArray(value2);
      if (areArrays && !UtilsService.areArraysEqual(value1, value2)) {
        return false;
      }

      // Compare nested objects recursively
      const areObjects = typeof value1 === 'object' && typeof value2 === 'object' && !areArrays;
      if (
        (areObjects && !UtilsService.areObjectsEqual(value1, value2)) ||
        (!areObjects && value1 !== value2)
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Compares two arrays and returns true if all their elements are the same, except for default values.
   * The default value is auto-detected based on the element's data type.
   * @param arr1 - The first array to compare.
   * @param arr2 - The second array to compare.
   * @returns True if the arrays are equal (ignoring default values), false otherwise.
   */
  static areArraysEqual(arr1: any[], arr2: any[]): boolean {
    if (arr1.length !== arr2.length) {
      return false;
    }

    for (let i = 0; i < arr1.length; i++) {
      const value1 = arr1[i];
      const value2 = arr2[i];

      // Detect default value based on type
      const defaultValue1 = UtilsService.getDefaultValue(value1);
      const defaultValue2 = UtilsService.getDefaultValue(value2);

      // Skip default values in both arrays
      const isDefaultValue1 = value1 === defaultValue1;
      const isDefaultValue2 = value2 === defaultValue2;

      if (isDefaultValue1 && isDefaultValue2) {
        continue;
      }

      // Compare nested arrays or objects recursively
      const areObjects = typeof value1 === 'object' && typeof value2 === 'object';
      if (
        (areObjects && !UtilsService.areObjectsEqual(value1, value2)) ||
        (!areObjects && value1 !== value2)
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Gets the default value for a given value based on its type.
   * @param value - The value to determine the default for.
   * @returns The default value for the type of the given value.
   */
  static getDefaultValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }
    const type = typeof value;
    switch (type) {
      case 'string':
        return '';
      case 'number':
        return 0;
      case 'boolean':
        return false;
      case 'object':
        if (Array.isArray(value)) {
          return [];
        }
        return null;
      default:
        return undefined;
    }
  }

  static localStorageSetItem(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value))
  }

  static localStorageGetItem<T>(key: string): T | null {
    let value = localStorage.getItem(key);
    if(value) {
      let parseValue: T = JSON.parse(value);
      return parseValue;
    }

    return null;
  }

  static async ObservableToPromise<T>(observable: Observable<T>, nextFn?: (value: T) => void, errorFn?: (error: any) => void): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      observable.pipe(first()).subscribe({
        next: (v) => {
          if(nextFn)
            nextFn(v);
          resolve(v);
        },
        error: (e) => {
          if(errorFn)
            errorFn(e);
          reject(e);
        }
      })
    })
  }

  static fixPrototype<T>(classEntity: any) {
    return <T>(source: Observable<T>): Observable<T> => {
      return new Observable(subscriber => {
        source.subscribe({
          next(value) {
            if(value !== undefined && value !== null) {
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

  static createObject<T>(_createClass: {new (): T}): T {
    return new _createClass();
  }

  static getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
  }

  static setField(obj: Object, fieldName: string, value: any) {
    Object.defineProperty(obj, fieldName, {
      value: value,
      writable: true,
      enumerable: true,
      configurable: true
    });
  }

  static waitLoadingSnackBar<T>(snackBar?: MatSnackBar, message: string = 'Loading...', action?: string, duration: number = -1, matSnackBarHorizontalPosition: MatSnackBarHorizontalPosition = MatSnackBarHorizontalPosition.RIGHT, matSnackBarVerticalPosition: MatSnackBarVerticalPosition = MatSnackBarVerticalPosition.BOTTOM) {
    if(snackBar) {
      let bar: MatSnackBarRef<any>;
      
      return pipe(
        UtilsService.startWithTap<T>(() => {
          bar = UtilsService.openSnackBar(snackBar, message, action, duration, matSnackBarHorizontalPosition, matSnackBarVerticalPosition);
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
    if(snackBar) {
      let bar: MatSnackBarRef<any>;
      
      return pipe(
        UtilsService.startWithTap<T>(() => {
          bar = UtilsService.openSnackBarDynamicString(snackBar, message, maxLength, action, duration, matSnackBarHorizontalPosition, matSnackBarVerticalPosition);
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
    if(matDialog) {
      let dialog = matDialog.open(LoadingDialog, {
        disableClose: true
      });
      
      return pipe(
        UtilsService.startWithTap<T>(() => {
          dialog.afterClosed().subscribe({
            next: () => {}
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
      next: () => {}
    })

    if(timeout) {
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

  static makeId(length: number): string {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }

  static getQueryParams(): {[key: string]: string} {
    let url = window.location.href;
    let result: {[key: string]: string} = {};
    let query = url.split('?')[1];
    if(query) {
      let params = query.split('&');
      params.forEach(param => {
        let key = param.split('=')[0];
        let value = param.split('=')[1];
        result[key] = value;
      })
    }
    return result;
  }

  static getQueryParam(key: string): string | null {
    let queryParams = UtilsService.getQueryParams();
    return queryParams[key] ?? null;
  }

  static setQueryParam(param: string, value: string | null) {
    const currentUrl = window.location.href;
    const url = new URL(currentUrl);
    const params = new URLSearchParams(url.search);

    if (value !== null) {
      params.set(param, value);
    } else {
      params.delete(param);
    }

    const newUrl = `${url.origin}${url.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newUrl);
  }

  /**
   * Retrieves the value of a URL path variable.
   * @param variableName - The name of the path variable to retrieve.
   * @returns The value of the path variable, or null if it is not found.
   * @example path = '/users/123' and variableName = 'users' => returns '123'
   */
  static getPathVariable(variableName: string): string | null {
    // Get the current URL using window.location.href
    const url = window.location.href;
    
    // Split the URL into segments
    const segments = url.split('/').filter(segment => segment); // Remove empty segments

    // Find the index of the variable name
    const index = segments.indexOf(variableName);

    // If the variable exists and is not the last segment, return the next segment
    if (index !== -1 && index + 1 < segments.length) {
      return segments[index + 1];
    }

    return null; // Return null if the variable is not found
  }

  static reTryIfFail(fn: () => any, timeout?: number) {
    try {
      fn();
    }
    catch (error) {
      setTimeout(() => {
        this.reTryIfFail(fn, timeout);
      }, timeout ?? 1000);
    }
  }

  static readBlobAsText(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
  
      reader.onload = () => {
        resolve(reader.result as string);
      };
  
      reader.onerror = () => {
        reject(new Error('Failed to read Blob'));
      };
  
      reader.readAsText(blob);
    });
  }

  static isEnum(obj: any): boolean {
    return typeof obj === "object" && Object.keys(obj).length > 0 && Object.values(obj).every(val => {
        return typeof val === 'string' || typeof val === 'number';
    });
  }

  static getEnumValues(enumObj: any): (string | number)[] {
    if (UtilsService.isEnum(enumObj)) {
        let arr: (string | number)[] = [];
        Object.values(enumObj).forEach(value => {
            if (typeof value === "string" || typeof value === "number") {
                arr.push(value);
            }
        })
        return arr;
    }
    return [];  
  }

  static getEnumMatOptions(Enum: any): MatOption<any>[] {
    let matOptions: MatOption<any>[] = [];
      UtilsService.getEnumValues(Enum).forEach(e => {
        matOptions.push({
          value: e,
          valueLabel: e.toString()
        })
      })

    return matOptions;
  }

  static async isObjectUrlValid(url: string): Promise<boolean> {
    return fetch(url)
      .then(response => response.ok)
      .catch(() => false);
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

  static getMaxString(str: string, length: number, replaceWith: string = '...'): string {
    if(str.length > length) {
      return str.substring(0, length) + replaceWith;
    }
    return str;
  }
}