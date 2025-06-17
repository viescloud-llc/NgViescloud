import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'projects/environments/environment.prod';
import { first, firstValueFrom, map, Observable, of, pipe, switchMap, throwError, UnaryFunction } from 'rxjs';
import { UtilsService } from './utils.service';
import { VFile } from '../model/vies.model';
import { Metadata } from '../model/object-storage-manager.model';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RxJSUtils } from '../util/RxJS.utils';
import { PopupArgs, PopupType } from '../model/popup.model';
import { HttpParamsBuilder } from '../model/utils.model';
import { ViesService } from './rest.service';
import { RouteUtils } from '../util/Route.utils';
import { FileUtils } from '../util/File.utils';

@Injectable({
  providedIn: 'root'
})
export abstract class ObjectStorage extends ViesService {
  objectUrlCache = new Map<string, string>();

  constructor(
    httpClient: HttpClient,
    public rxjsUtils: RxJSUtils
  ) {
    super(httpClient);
  }

  getFile(requestParams: { id?: number, path?: string, fileName?: string, width?: number, height?: number }) {
    let params = new HttpParamsBuilder();
    params.setIfValid('id', requestParams.id);
    params.setIfValid('path', requestParams.path);
    params.setIfValid('fileName', requestParams.fileName);
    params.setIfValid('width', requestParams.width);
    params.setIfValid('height', requestParams.height);
    return this.httpClient.get(`${this.getPrefixUri()}/file`, { responseType: 'blob', params: params.build() }).pipe(first());
  }

  getFileByPath(path: string, width?: number, height?: number): Observable<Blob> {
    return this.getFile({ path: path, width: width, height: height });
  }

  getFileByFileName(fileName: string, width?: number, height?: number): Observable<Blob> {
    return this.getFile({ fileName: fileName, width: width, height: height });
  }

  getFileById(id: number, width?: number, height?: number): Observable<Blob> {
    return this.getFile({ id: id, width: width, height: height });
  }

  getAllFileMetadata(requestParams?: { path?: string, generateTemporaryDirectAccessLink?: boolean, directAccessLinkType?: 'GET' | 'POST' | 'PUT' | 'DELETE', linkDurationMinutes?: number }) {
    let params = new HttpParamsBuilder();
    params.setIfValid('path', requestParams?.path);
    params.setIfValid('generateTemporaryDirectAccessLink', requestParams?.generateTemporaryDirectAccessLink);
    params.setIfValid('directAccessLinkType', requestParams?.directAccessLinkType);
    params.setIfValid('linkDurationMinutes', requestParams?.linkDurationMinutes);
    return this.httpClient.get<Metadata[]>(`${this.getPrefixUri()}/metadata/all`, { params: params.build() })
      .pipe(
        map(metadatas => {
          if (requestParams && requestParams.generateTemporaryDirectAccessLink) {
            for (let metadata of metadatas) {
              if (metadata.path && !metadata.temporaryAccessLink) {
                metadata.temporaryAccessLink = this.generateViesLinkFromPath(metadata.path);
              }
            }
          }
          return metadatas;
        }),
        first()
      );
  }

  getFileMetaData(requestParams: { id?: number, path?: string, fileName?: string, generateTemporaryDirectAccessLink?: boolean, directAccessLinkType?: 'GET' | 'POST' | 'PUT' | 'DELETE', linkDurationMinutes?: number }) {
    let params = new HttpParamsBuilder();
    params.setIfValid('id', requestParams.id);
    params.setIfValid('path', requestParams.path);
    params.setIfValid('fileName', requestParams.fileName);
    params.setIfValid('generateTemporaryDirectAccessLink', requestParams.generateTemporaryDirectAccessLink);
    params.setIfValid('directAccessLinkType', requestParams.directAccessLinkType);
    params.setIfValid('linkDurationMinutes', requestParams.linkDurationMinutes);
    return this.httpClient.get<Metadata>(`${this.getPrefixUri()}/metadata`, { params: params.build() })
      .pipe(
        map(metadata => {
          if (requestParams.generateTemporaryDirectAccessLink && !metadata.temporaryAccessLink && metadata.path) {
            metadata.temporaryAccessLink = this.generateViesLinkFromPath(metadata.path);
          }
          return metadata;
        }),
        first()
      );
  }

  getFileMetadataByPath(path: string) {
    return this.getFileMetaData({ path: path });
  }

  getFileMetadataByFileName(fileName: string) {
    return this.getFileMetaData({ fileName: fileName });
  }

  getFileMetadataById(id: number) {
    return this.getFileMetaData({ id: id });
  }

  putFile(vFile: VFile, requestParams: { id?: number, path?: string, fileName?: string, width?: number, height?: number }) {
    let params = new HttpParamsBuilder();
    params.setIfValid('id', requestParams.id);
    params.setIfValid('path', requestParams.path);
    params.setIfValid('fileName', requestParams.fileName);
    params.setIfValid('width', requestParams.width);
    params.setIfValid('height', requestParams.height);

    if (vFile.rawFile) {
      const formData = new FormData();
      formData.append('file', vFile.rawFile, vFile.name);
      return this.httpClient.put<Metadata>(`${this.getPrefixUri()}/file`, formData, { params: params.build() }).pipe(first());
    }
    else
      return throwError(() => new Error('File can not be null'));
  }

  putFileById(id: number, vFile: VFile) {
    return this.putFile(vFile, { id: id });
  }

  putFileByFileName(fileName: string, vFile: VFile) {
    return this.putFile(vFile, { fileName: fileName });
  }

  putFileByPath(path: string, vFile: VFile) {
    return this.putFile(vFile, { path: path });
  }

  postFile(vFile: VFile) {
    if (vFile.rawFile) {
      const formData = new FormData();
      formData.append('file', vFile.rawFile, vFile.name);
      return this.httpClient.post<Metadata>(`${this.getPrefixUri()}/file`, formData).pipe(first());
    }
    else
      throw Error('File can not be null');
  }

  patchMetaData(metadata: Metadata, requestParams: { id?: number, path?: string, fileName?: string }) {
    let params = new HttpParamsBuilder();
    params.setIfValid('id', requestParams.id);
    params.setIfValid('path', requestParams.path);
    params.setIfValid('fileName', requestParams.fileName);
    return this.httpClient.patch<Metadata>(`${this.getPrefixUri()}/metadata`, metadata, { params: params.build() }).pipe(first());
  }

  patchMetadataById(metadata: Metadata, id: number) {
    return this.patchMetaData(metadata, { id: id });
  }

  patchMetadataByFileName(metadata: Metadata, fileName: string) {
    return this.patchMetaData(metadata, { fileName: fileName });
  }

  patchMetadataByPath(metadata: Metadata, path: string) {
    return this.patchMetaData(metadata, { path: path });
  }

  deleteFile(requestParams: { id?: number, path?: string, fileName?: string }) {
    let params = new HttpParamsBuilder();
    params.setIfValid('id', requestParams.id);
    params.setIfValid('path', requestParams.path);
    params.setIfValid('fileName', requestParams.fileName);
    return this.httpClient.delete<void>(`${this.getPrefixUri()}/file`, { params: params.build() }).pipe(first());
  }

  deleteFileById(id: number) {
    return this.deleteFile({ id: id });
  }

  deleteFileByFileName(fileName: string) {
    return this.deleteFile({ fileName: fileName });
  }

  deleteFileByPath(path: string) {
    return this.deleteFile({ path: path });
  }

  //------------------------------CUSTOM METHODS-----------------------------

  containViesLink(link: string) {
    return link.startsWith(`${this.getPrefixUri()}/file`);
  }

  generateViesLinkFromPath(path: string) {
    return `${this.getPrefixUri()}/file?path=${path}`
  }

  private getLoadingPipe<T>(args?: PopupArgs) {
    if (args) {
      if (args.unaryFunction) {
        return pipe(args.unaryFunction);
      }

      if (args.type) {
        switch (args.type) {
          case PopupType.STRING_SNACKBAR:
            return this.rxjsUtils.waitLoadingSnackBar<T>(args.message ?? '', args.dismissLabel ?? '');
          case PopupType.DYNAMIC_STRING_SNACKBAR:
            return this.rxjsUtils.waitLoadingDynamicStringSnackBar<T>(args.message ?? '', args.maxLength ?? 40, args.dismissLabel ?? '');
          case PopupType.LOADING_DIALOG:
            return this.rxjsUtils.waitLoadingDialog<T>();
          case PopupType.MESSAGE_POPUP:
            return this.rxjsUtils.waitLoadingMessagePopup<T>(args.message ?? '', args.dismissLabel ?? '');
          case PopupType.DYNAMIC_MESSAGE_POPUP:
            return this.rxjsUtils.waitLoadingDynamicMessagePopup<T>(args.message ?? '', args.dismissLabel ?? '');
          default:
            return pipe();
        }
      }
    }

    return pipe();
  }

  async postOrPutFile(vFile: VFile, popupArgs?: PopupArgs) {
    if (popupArgs) {
      popupArgs.message = popupArgs.message ?? `Uploading ${vFile.name}...`;
    }

    if (vFile.rawFile) {
      let exist = await firstValueFrom(this.getFileMetaData({ fileName: vFile.name }).pipe(this.getLoadingPipe(popupArgs))).catch(err => null);

      if (exist) {
        return firstValueFrom(this.putFile(vFile, { fileName: vFile.name }).pipe(this.getLoadingPipe(popupArgs)));
      }
      else {
        return firstValueFrom(this.postFile(vFile).pipe(this.getLoadingPipe(popupArgs)));
      }
    }
    else {
      return Promise.reject(new Error('File can not be null'));
    }
  }

  async putOrPostFileAndGetViescloudUrl(vFile: VFile, popupArgs?: PopupArgs) {
    return new Promise<string>((resolve, reject) => {
      this.postOrPutFile(vFile, popupArgs)
        .then((data) => {
          resolve(this.generateViesLinkFromPath(data.path!))
        })
        .catch((error) => {
          reject(error);
        })
    })
  }

  async fetchFileAndGenerateObjectUrl(uri: string, popupArgs?: PopupArgs) {
    if(this.objectUrlCache.has(uri)) {
      let objectUrl = this.objectUrlCache.get(uri);
      let isActiveUrl = await FileUtils.isObjectUrlActive(objectUrl!).catch(err => false);
      if(isActiveUrl) {
        return objectUrl!;
      }
      else {
        URL.revokeObjectURL(objectUrl!);
      }
    }

    let error: any;
    let vFile = await this.fetchFile(uri, popupArgs).catch(error => {
      error = error;
      return null;
    });

    if (vFile && vFile.rawFile) {
      vFile.objectUrl = URL.createObjectURL(vFile.rawFile);
      this.objectUrlCache.set(uri, vFile.objectUrl);
      return vFile.objectUrl;
    }

    return Promise.reject(error);
  }


  async fetchFile(uri: string, popupArgs?: PopupArgs): Promise<VFile> {
    if (!this.containViesLink(uri)) {
      return UtilsService.fetchAsVFile(uri)
    }
    else {
      return firstValueFrom(this.httpClient.get(uri, { observe: 'response', responseType: 'blob' })
        .pipe(this.getLoadingPipe(popupArgs))
        .pipe(
          map((response) => {
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
              objectUrl: ''
            };

            return vFile;
          }),
          first()
        ))
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class ObjectStorageService extends ObjectStorage {
  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'object', 'storages'];
  }
}