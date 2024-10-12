import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'projects/environments/environment.prod';
import { first, Observable, pipe, UnaryFunction } from 'rxjs';
import { UtilsService, VFile } from './Utils.service';
import { Metadata } from '../model/ObjectStorageManager.model';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RxJSUtils } from '../util/RxJS.utils';
import { PopupType } from '../model/Popup.model';

@Injectable({
  providedIn: 'root'
})
export abstract class ObjectStorage {
  objectUrlCache = new Map<string, string>();
  vfileCache = new Map<string, VFile>();
  constructor(
    private httpClient: HttpClient,
    private rxjsUtils: RxJSUtils
  ) { }

  protected getURI(): string {
    return environment.gateway_api;
  }

  protected abstract getPrefixes(): string[];

  protected getPrefixPath(): string {
    let prefixes = this.getPrefixes();
    let path = "";
    prefixes.forEach(e => {
        path += `/${e}`;
    });
    return path;
  }

  getFileByPath(path: string, width?: number, height?: number): Observable<Blob> {
    if(width && height)
      return this.httpClient.get(`${this.getURI()}${this.getPrefixPath()}/file?path=${path}&width=${width}&height=${height}`, {responseType: 'blob'}).pipe(first());
    else
      return this.httpClient.get(`${this.getURI()}${this.getPrefixPath()}/file?path=${path}`, {responseType: 'blob'}).pipe(first());
  }

  getFileByFileName(fileName: string, width?: number, height?: number): Observable<Blob> {
    if(width && height)
      return this.httpClient.get(`${this.getURI()}${this.getPrefixPath()}/file?fileName=${fileName}&width=${width}&height=${height}`, {responseType: 'blob'}).pipe(first());
    else
      return this.httpClient.get(`${this.getURI()}${this.getPrefixPath()}/file?fileName=${fileName}`, {responseType: 'blob'}).pipe(first());
  }

  getFileById(id: number, width?: number, height?: number): Observable<Blob> {
    if(width && height)
      return this.httpClient.get(`${this.getURI()}${this.getPrefixPath()}/file?id=${id}&width=${width}&height=${height}`, {responseType: 'blob'}).pipe(first());
    else
      return this.httpClient.get(`${this.getURI()}${this.getPrefixPath()}/file?id=${id}`, {responseType: 'blob'}).pipe(first());
  }

  getAllFileMetadata() {
    return this.httpClient.get<Metadata[]>(`${this.getURI()}${this.getPrefixPath()}/metadata/all`).pipe(first());
  }

  getFileMetadataByPath(path: string) {
    return this.httpClient.get<Metadata>(`${this.getURI()}${this.getPrefixPath()}/metadata?path=${path}`).pipe(first());
  }

  getFileMetadataByFileName(fileName: string) {
    return this.httpClient.get<Metadata>(`${this.getURI()}${this.getPrefixPath()}/metadata?fileName=${fileName}`).pipe(first());
  }

  getFileMetadataById(id: number) {
    return this.httpClient.get<Metadata>(`${this.getURI()}${this.getPrefixPath()}/metadata?id=${id}`).pipe(first());
  }

  putFileById(id: number, vFile: VFile, publicity?: boolean) {
    if(vFile.rawFile) {
      const formData = new FormData();
      formData.append('file', vFile.rawFile, vFile.name);
      return this.httpClient.put<Metadata>(`${this.getURI()}${this.getPrefixPath()}/file?publicity=${publicity ?? false}&id=${id}`, formData).pipe(first());
    }
    else
      throw Error('File can not be null');
  }

  putFileByFileName(fileName: string, vFile: VFile, publicity?: boolean) {
    if(vFile.rawFile) {
      const formData = new FormData();  
      formData.append('file', vFile.rawFile, vFile.name);
      return this.httpClient.put<Metadata>(`${this.getURI()}${this.getPrefixPath()}/file?publicity=${publicity ?? false}&fileName=${fileName}`, formData).pipe(first());
    }
    else
      throw Error('File can not be null');
  }

  putFileByPath(path: string, vFile: VFile, publicity?: boolean) {
    if(vFile.rawFile) {
      const formData = new FormData();
      formData.append('file', vFile.rawFile, vFile.name);
      return this.httpClient.put<Metadata>(`${this.getURI()}${this.getPrefixPath()}/file?publicity=${publicity ?? false}&path=${path}`, formData).pipe(first());
    }
    else
      throw Error('File can not be null');
  }

  postFile(vFile: VFile, publicity?: boolean) {
    if(vFile.rawFile) {
      const formData = new FormData();
      formData.append('file', vFile.rawFile, vFile.name);
      return this.httpClient.post<Metadata>(`${this.getURI()}${this.getPrefixPath()}/file?publicity=${publicity ?? false}`, formData).pipe(first());
    }
    else
      throw Error('File can not be null');
  }

  patchMetadataById(metadata: Metadata, id: number) {
    return this.httpClient.patch<Metadata>(`${this.getURI()}${this.getPrefixPath()}/metadata?id=${id}`, metadata).pipe(first());
  }

  patchMetadataByFileName(metadata: Metadata, fileName: string) {
    return this.httpClient.patch<Metadata>(`${this.getURI()}${this.getPrefixPath()}/metadata?fileName=${fileName}`, metadata).pipe(first());
  }

  patchMetadataByPath(metadata: Metadata, path: string) {
    return this.httpClient.patch<Metadata>(`${this.getURI()}${this.getPrefixPath()}/metadata?path=${path}`, metadata).pipe(first());
  }

  deleteFileById(id: number) {
    return this.httpClient.delete<Metadata>(`${this.getURI()}${this.getPrefixPath()}/file?id=${id}`).pipe(first());
  }

  deleteFileByFileName(fileName: string) {
    return this.httpClient.delete<Metadata>(`${this.getURI()}${this.getPrefixPath()}/file?fileName=${fileName}`).pipe(first());
  }

  deleteFileByPath(path: string) {
    return this.httpClient.delete<Metadata>(`${this.getURI()}${this.getPrefixPath()}/file?path=${path}`).pipe(first());
  }

  //------------------------------CUSTOM METHODS-----------------------------

  containViesLink(link: string) {
    return link.startsWith(`${this.getURI()}${this.getPrefixPath()}/file`);
  }

  generateViesLinkFromPath(path: string) {
    return `${this.getURI()}${this.getPrefixPath()}/file?path=${path}`
  }

  extractExtensionFromViesLink(link: string) {
    let lastDotIndex = link.lastIndexOf('.');
    if(lastDotIndex === -1) {
      return '';
    }
    return link.slice(lastDotIndex + 1);
  }

  extractPathFromViesLink(link: string) {
    if(this.containViesLink(link)) {
      let length = `${this.getURI()}${this.getPrefixPath()}/file?path=`.length;
      return link.substring(length);
    }
    else
      return link;
  }

  extractFileNameFromViesLink(link: string) {
    if(this.containViesLink(link)) {
      let length = `${this.getURI()}${this.getPrefixPath()}/file?fileName=`.length;
      return link.substring(length);
    }
    else
      return link;
  }

  extractIdFromViesLink(link: string) {
    if(this.containViesLink(link)) {
      let length = `${this.getURI()}${this.getPrefixPath()}/file?id=`.length;
      return link.substring(length);
    }
    else
      return link;
  }

  private getLoadingPipe<T>(popupType: PopupType, message: string = '', dismissLabel: string = '') {
    switch(popupType) {
      case PopupType.STRING_SNACKBAR:
        return this.rxjsUtils.waitLoadingSnackBar<T>(message, dismissLabel);
      case PopupType.DYNAMIC_STRING_SNACKBAR:
        return this.rxjsUtils.waitLoadingDynamicStringSnackBar<T>(message, 40, dismissLabel);
        case PopupType.LOADING_DIALOG:
        return this.rxjsUtils.waitLoadingDialog<T>();
      case PopupType.MESSAGE_POPUP:
        return this.rxjsUtils.waitLoadingMessagePopup<T>(message, dismissLabel);
      case PopupType.DYNAMIC_MESSAGE_POPUP:
        return this.rxjsUtils.waitLoadingDynamicMessagePopup<T>(message, dismissLabel);
      default:
        return pipe();
    }
  }

  putOrPostFile(vFile: VFile, publicity?: boolean, popupType: PopupType = PopupType.NONE) {
    return new Promise<Metadata>((resolve, reject) => {
      if(vFile.rawFile) {
        this.getFileMetadataByFileName(vFile.name).pipe(this.getLoadingPipe(popupType, `Uploading ${vFile.name}...`, 'Dismiss')).subscribe({
          next: (data1) => {
            if(data1) {
              this.putFileByFileName(vFile.name, vFile, publicity).pipe(this.getLoadingPipe(popupType, `Uploading ${vFile.name}...`, 'Dismiss')).subscribe({
                next: (data2) => {
                  resolve(data2);
                },
                error: (error) => {
                  reject(error);
                }
              })
            }
          },
          error: (error) => {
            this.postFile(vFile, publicity).pipe(this.getLoadingPipe(popupType, `Uploading ${vFile.name}...`, 'Dismiss')).subscribe({
              next: (data3) => {
                resolve(data3);
              },
              error: (error) => {
                reject(error);
              }
            })
          }
        })
      }
      else
        reject('File can not be null');
    })
  }

  putOrPostFileAndGetViescloudUrl(vFile: VFile, publicity?: boolean, popupType: PopupType = PopupType.NONE) {
    return new Promise<string>((resolve, reject) => {
      this.putOrPostFile(vFile, publicity, popupType)
      .then((data) => {
        resolve(this.generateViesLinkFromPath(data.path!))
      })
      .catch((error) => {
        reject(error);
      })
    })
  }

  generateObjectUrlFromViescloudUrl(viescloudUrl: string, popupType: PopupType = PopupType.NONE) {
    return new Promise<string>((resolve, reject) => {
      if(this.objectUrlCache.has(viescloudUrl)) {
        UtilsService.isObjectUrlValid(this.objectUrlCache.get(viescloudUrl)!)
        .then((data) => {
          resolve(this.objectUrlCache.get(viescloudUrl)!);
        })
        .catch((error) => {
          this.generateObjectUrl(viescloudUrl, popupType, resolve, reject);
        })
      } 
      else {
        this.generateObjectUrl(viescloudUrl, popupType, resolve, reject);
      }
    })
  }

  private generateObjectUrl(viescloudUrl: string, popupType: PopupType = PopupType.NONE, resolve: (value: string | PromiseLike<string>) => void, reject: (reason?: any) => void) {
    this.httpClient.get(viescloudUrl, { responseType: 'blob' })
    .pipe(first())
    .pipe(this.getLoadingPipe(popupType, `Loading ${viescloudUrl}`, 'Dismiss'))
    .subscribe({
      next: (data) => {
        let url = URL.createObjectURL(data);
        this.objectUrlCache.set(viescloudUrl, url);
        resolve(url);
      },
      error: (error) => {
        reject(error);
      }
    });
  }

  fetchFile(uri: string): Observable<VFile> {
    return new Observable<VFile>(observer => {
      if(this.vfileCache.has(uri)) {
        observer.next(this.vfileCache.get(uri)!);
        observer.complete();
        return;
      } 
      else if(!this.containViesLink(uri)) {
        UtilsService.fetchAsVFile(uri).then(file => {
          this.vfileCache.set(uri, file);
          observer.next(file);
          observer.complete();
        }).catch(err => {
          observer.error(err);
        })
      } 
      else {
        this.httpClient.get(uri, { observe: 'response', responseType: 'blob' })
          .subscribe({
            next: (response) => {
              let contentType = response.headers.get('Content-Type') || '';
              let fileName = uri.substring(uri.lastIndexOf('/') + 1);
              let extension = '';
  
              if (!contentType) {
                // If Content-Type is not provided, derive it from the file name
                extension = fileName.split('.').pop()?.toLowerCase() || '';
                contentType = UtilsService.mapExtensionToContentType(extension);
              } else {
                // If Content-Type is provided, extract extension from it
                extension = contentType.split('/')[1];
              }
        
              const vFile: VFile = {
                name: fileName,
                type: contentType,
                extension: extension,
                rawFile: response.body as Blob,
                originalLink: uri,
                value: ''
              };
  
              this.vfileCache.set(uri, vFile);
              observer.next(vFile);
              observer.complete();
            },
            error: (error) => {
              observer.error(error);
            }
          });
      }
    });
  }
}

@Injectable({
  providedIn: 'root'
})
export class SmbStorageServiceV1 extends ObjectStorage {
  protected override getPrefixes(): string[] {
    return ['osm', 'smb', 'v1'];
  }
}

@Injectable({
  providedIn: 'root'
})
export class S3StorageServiceV1 extends ObjectStorage {
  protected override getPrefixes(): string[] {
    return ['osm', 's3', 'v1'];
  }
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseStorageServiceV1 extends ObjectStorage {
  protected override getPrefixes(): string[] {
    return ['osm', 'database', 'v1'];
  }
}