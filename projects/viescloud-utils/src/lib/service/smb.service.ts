import { Injectable } from '@angular/core';
import { ViesRestService } from './rest.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'projects/environments/environment.prod';
import { Observable, first } from 'rxjs';
import { Metadata } from '../model/smb.model';
import { VFile } from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class SmbService {

  constructor(private httpClient: HttpClient) { }

  protected getURI(): string {
    return environment.gateway_api;
  }

  protected getPrefixes(): string[] {
    return ["smb"]
  }

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

  getFileByPath(path: string): Observable<Blob> {
    return this.httpClient.get(`${this.getURI()}${this.getPrefixPath()}/file?path=${path}`, {responseType: 'blob'}).pipe(first());
  }

  getFileByFileName(fileName: string): Observable<Blob> {
    return this.httpClient.get(`${this.getURI()}${this.getPrefixPath()}/file?fileName=${fileName}`, {responseType: 'blob'}).pipe(first());
  }

  getFileById(id: number): Observable<Blob> {
    return this.httpClient.get(`${this.getURI()}${this.getPrefixPath()}/file?id=${id}`, {responseType: 'blob'}).pipe(first());
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

  getFileMetadataByPath(path: string) {
    return this.httpClient.get<Metadata>(`${this.getURI()}${this.getPrefixPath()}/metadata?path=${path}`).pipe(first());
  }

  getFileMetadataByFileName(fileName: string) {
    return this.httpClient.get<Metadata>(`${this.getURI()}${this.getPrefixPath()}/metadata?fileName=${fileName}`).pipe(first());
  }

  getFileMetadataById(id: number) {
    return this.httpClient.get<Metadata>(`${this.getURI()}${this.getPrefixPath()}/metadata?id=${id}`).pipe(first());
  }

  getAllFileMetadata() {
    return this.httpClient.get<Metadata[]>(`${this.getURI()}${this.getPrefixPath()}/metadata/all`).pipe(first());
  }
}
