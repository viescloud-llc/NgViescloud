import { Injectable } from '@angular/core';
import { EnsibleService } from '../ensible/ensible.service';
import { EnsibleFsStatusResponse, FSTree, FsWriteMode } from '../../model/ensible.model';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EnsibleFsService extends EnsibleService {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'fs'];
  }

  scanFoler(path: string) {
    let params = new HttpParams().set('path', path);

    return this.httpClient.get<FSTree>(`${this.getPrefixUri()}`, {params: params});
  }

  readFileAsString(path: string): Observable<string> {
    let params = new HttpParams().set('path', path);

    return this.httpClient.get(`${this.getPrefixUri()}/read`, {params: params, responseType: 'text'});
  }

  readFileAsBlob(path: string): Observable<Blob> {
    let params = new HttpParams().set('path', path);

    return this.httpClient.get(`${this.getPrefixUri()}/read/bytes`, {params: params, responseType: 'blob'});
  }

  writeFile(path: string, content: string, writeMode: FsWriteMode = FsWriteMode.OVERRIDEN) {
    let params = new HttpParams().set('path', path)
                                 .set('mode', writeMode);

    return this.httpClient.post<EnsibleFsStatusResponse>(`${this.getPrefixUri()}/write`, content, {params: params});
  }

  writeFileWithBlob(path: string, content: Blob, writeMode: FsWriteMode = FsWriteMode.OVERRIDEN) {
    let params = new HttpParams().set('path', path)
                                 .set('mode', writeMode);

    return this.httpClient.post<EnsibleFsStatusResponse>(`${this.getPrefixUri()}/write/bytes`, content, {params: params});
  }

  copyFile(sourcePath: string, targetPath: string, writeMode: FsWriteMode = FsWriteMode.OVERRIDEN, absolutePath: boolean = false) {
    let params = new HttpParams().set('sourcePath', sourcePath)
                                 .set('targetPath', targetPath)
                                 .set('mode', writeMode)
                                 .set('isAbsolutePath', absolutePath);

    return this.httpClient.put<EnsibleFsStatusResponse>(`${this.getPrefixUri()}/copy`, null, {params: params});
  }

  moveFile(sourcePath: string, targetPath: string, writeMode: FsWriteMode = FsWriteMode.OVERRIDEN, absolutePath: boolean = false) {
    let params = new HttpParams().set('sourcePath', sourcePath)
                                 .set('targetPath', targetPath)
                                 .set('mode', writeMode)
                                 .set('isAbsolutePath', absolutePath);

    return this.httpClient.put<EnsibleFsStatusResponse>(`${this.getPrefixUri()}/move`, null, {params: params});
  }

  deleteFile(path: string) {
    let params = new HttpParams();
    params.set('path', path);

    return this.httpClient.delete<EnsibleFsStatusResponse>(`${this.getPrefixUri()}`, {params: params});
  }

}
