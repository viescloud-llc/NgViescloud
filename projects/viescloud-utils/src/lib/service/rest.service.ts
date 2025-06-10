import { Observable, first, firstValueFrom, map } from "rxjs";
import HttpClientUtils from "../model/http-client-utils.model";
import { HttpClient } from "@angular/common/http";
import { UtilsService } from "./utils.service";
import { environment } from "projects/environments/environment.prod";
import { Pageable, PropertyMatcherEnum } from "../model/mat.model";
import { MatDialog } from "@angular/material/dialog";
import { ObjectDialog, ObjectDialogData } from "../dialog/object-dialog/object-dialog.component";
import { Injectable } from "@angular/core";
import { RxJSUtils } from "../util/RxJS.utils";
import { HttpParamsBuilder } from "../model/utils.model";
import { RouteUtils } from "../util/Route.utils";

export abstract class ViesService {

    constructor(protected httpClient: HttpClient) {

    }

    protected getURI(): string {
        return ViesService.getUri();
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

    public getPrefixUri(): string {
        return `${this.getURI()}${this.getPrefixPath()}`;
    }

    static getParseUri() {
        if(environment.gateway_detection === 'static')
            return RouteUtils.parseUrl(environment.gateway_api);
        else
            return RouteUtils.getCurrentSchemasHostPortParsed();    
    }

    static getUri() {
        if(environment.gateway_detection === 'static')
            return environment.gateway_api;
        else
            return RouteUtils.getCurrentSchemasHostPort();
    }
}

@Injectable({
    providedIn: 'root'
})
export abstract class ViesRestService<T extends Object> extends ViesService {

    constructor(httpClient: HttpClient) {
        super(httpClient);
    }

    public getAll(): Observable<T[]> {
        return this.httpClient.get<T[]>(`${this.getPrefixUri()}`).pipe(map(data => data ?? [])).pipe(first());
    }

    public getAllPageable(page: number, size: number, sort?: string): Observable<Pageable<T>> {
        let params = new HttpParamsBuilder();
        params.set('page', page);
        params.set('size', size);
        params.setIfValid('sort', sort);
        return this.httpClient.get<Pageable<T>>(`${this.getPrefixUri()}`, {params: params.build()}).pipe(map(data => data ?? [])).pipe(first());
    }

    public get(id: any): Observable<T> {
        return this.httpClient.get<T>(`${this.getPrefixUri()}/${id}`).pipe(first());
    }

    public post(object: T): Observable<T> {
        return this.httpClient.post<T>(`${this.getPrefixUri()}`, object).pipe(first());
    }

    public put(id: any, object: T): Observable<T> {
        return this.httpClient.put<T>(`${this.getPrefixUri()}/${id}`, object).pipe(first());
    }

    public patch(id: any, object: T): Observable<T> {
        return this.httpClient.patch<T>(`${this.getPrefixUri()}/${id}`, object).pipe(first());
    }

    public delete(id: any): Observable<void> {
        return this.httpClient.delete<void>(`${this.getPrefixUri()}/${id}`).pipe(first());
    }

    public async getAsync(id: any, nextFn?: (value: T) => void, errorFn?: (error: any) => void) {
        return UtilsService.ObservableToPromise(this.get(id), nextFn, errorFn);
    }

    public async getAllAsync(nextFn?: (value: T[]) => void, errorFn?: (error: any) => void) {
        return UtilsService.ObservableToPromise(this.getAll(), nextFn, errorFn);
    }

    public openDialog(matDialog: MatDialog, id: any, blankObject: T, waitLoadingDialog?: boolean, title?: string) {
      let objectDialogData: ObjectDialogData<T, ViesRestService<T>> = {
          id: id,
          service: this,
          title: title ? title : id ? "Edit Data" : "Create New",
          getFn: (service: ViesRestService<T>, id: any) => id ? this.getFirstValueFrom(service.get(id), matDialog, waitLoadingDialog ?? false) : structuredClone(blankObject),
          createFn: id ? undefined : (service: ViesRestService<T>, value: T) => this.getFirstValueFrom(service.post(value), matDialog, waitLoadingDialog ?? false),
          modifyFn: id ? (service: ViesRestService<T>, value: T) => this.getFirstValueFrom(service.put(id, value), matDialog, waitLoadingDialog ?? false) : undefined,
          blankObject: blankObject
      }

      return matDialog.open(ObjectDialog, { data: objectDialogData , width: '100%'}).afterClosed();
    }

    private getFirstValueFrom(observable: Observable<T>, matDialog: MatDialog, waitLoadingDialog: boolean): Promise<T> {
      return waitLoadingDialog ? firstValueFrom(observable.pipe(RxJSUtils.waitLoadingDialog(matDialog))) : firstValueFrom(observable);
    }

    public postOrPut(id: any, object: T): Observable<T> {
      return this.parseId(id) ? this.put(id, object) : this.post(object);
    }

    public postOrPatch(id: any, object: T): Observable<T> {
      return this.parseId(id) ? this.patch(id, object) : this.post(object);
    }

    private parseId(id: any) {
      if(typeof id === 'string')
          return parseInt(id);
      else
          return id;
    }
}
