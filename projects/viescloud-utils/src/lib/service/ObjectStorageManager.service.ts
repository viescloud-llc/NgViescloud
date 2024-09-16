import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'projects/environments/environment.prod';
import { first, Observable } from 'rxjs';
import { UtilsService, VFile } from './Utils.service';
import { Metadata } from '../model/ObjectStorageManager.model';
import { MatDialog } from '@angular/material/dialog';

export abstract class ObjectStorage {
  constructor(private httpClient: HttpClient) { }

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
    let length = `${this.getURI()}${this.getPrefixPath()}/file?path=`.length;
    return link.substring(length);
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

  putOrPostFile(vFile: VFile, publicity?: boolean, matDialog?: MatDialog) {
    return new Promise<Metadata>((resolve, reject) => {
      if(vFile.rawFile) {
        this.getFileMetadataByFileName(vFile.name).pipe(UtilsService.waitLoadingDialog(matDialog)).subscribe({
          next: (data1) => {
            if(data1) {
              this.putFileByFileName(vFile.name, vFile, publicity).pipe(UtilsService.waitLoadingDialog(matDialog)).subscribe({
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
            this.postFile(vFile, publicity).pipe(UtilsService.waitLoadingDialog(matDialog)).subscribe({
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

  putOrPostFileAndGetViescloudUrl(vFile: VFile, publicity?: boolean, matDialog?: MatDialog) {
    return new Promise<string>((resolve, reject) => {
      this.putOrPostFile(vFile, publicity, matDialog)
      .then((data) => {
        resolve(this.generateViesLinkFromPath(data.path!))
      })
      .catch((error) => {
        reject(error);
      })
    })
  }

  generateObjectUrlFromViescloudUrl(viescloudUrl: string, matDialog?: MatDialog) {
    return new Promise<string>((resolve, reject) => {
      if(matDialog) {
        this.httpClient.get(viescloudUrl, {responseType: 'blob'}).pipe(first()).pipe(UtilsService.waitLoadingDialog(matDialog)).subscribe({
          next: (data) => {
            resolve(URL.createObjectURL(data));
          },
          error: (error) => {
            reject(error);
          }
        })
      }
      else {
        this.httpClient.get(viescloudUrl, {responseType: 'blob'}).pipe(first()).subscribe({
          next: (data) => {
            resolve(URL.createObjectURL(data));
          },
          error: (error) => {
            reject(error);
          }
        })
      }
    })
  }
}

@Injectable({
  providedIn: 'root'
})
export class SmbStorageServiceV1 extends ObjectStorage {

  constructor(httpClient: HttpClient) {
    super(httpClient);
  }

  protected override getPrefixes(): string[] {
    return ['osm', 'smb', 'v1'];
  }

}

@Injectable({
  providedIn: 'root'
})
export class S3StorageServiceV1 extends ObjectStorage {

  constructor(httpClient: HttpClient) {
    super(httpClient);
  }

  protected override getPrefixes(): string[] {
    return ['osm', 's3', 'v1'];
  }

}

@Injectable({
  providedIn: 'root'
})
export class DatabaseStorageServiceV1 extends ObjectStorage {

  constructor(httpClient: HttpClient) {
    super(httpClient);
  }

  protected override getPrefixes(): string[] {
    return ['osm', 'database', 'v1'];
  }

}