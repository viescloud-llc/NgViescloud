import { Observable, first, firstValueFrom, map } from "rxjs";
import { HttpClient } from "@angular/common/http";
import { UtilsService } from "./utils.service";
import { environment } from "projects/environments/environment.prod";
import { MatDialog } from "@angular/material/dialog";
import { ObjectDialog, ObjectDialogData } from "../dialog/object-dialog/object-dialog.component";
import { Injectable } from "@angular/core";
import { RxJSUtils } from "../util/RxJS.utils";
import { HttpParamsBuilder } from "../model/utils.model";
import { RouteUtils } from "../util/Route.utils";
import { MatchByEnum, MatchCaseEnum, Pageable } from "../model/vies.model";

type envConfig = {
    gateway_api: string
}

export abstract class ViesService {

    private static env: envConfig | null | undefined;

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
        const env_gateway_api = this.loadEnvSync()?.gateway_api;
        if (env_gateway_api) {
            return RouteUtils.parseUrl(env_gateway_api);
        }
        else {
            return RouteUtils.getCurrentSchemasHostPortParsed();
        }
    }

    static getUri() {
        const env_gateway_api = this.loadEnvSync()?.gateway_api;
        if (env_gateway_api) {
            return env_gateway_api;
        }
        else {
            return RouteUtils.getCurrentSchemasHostPort();
        }
    }

    private static loadEnvSync() {
        if (this.env || this.env === null) {
            return this.env;
        }
    
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', '/assets/env.json', false); // false = synchronous
          xhr.send();
    
          if (xhr.status === 200) {
            const config = JSON.parse(xhr.responseText);
            this.env = config;
            return config;
          } else {
            console.log(`Failed to load config synchronously: HTTP error! status: ${xhr.status}`);
            this.env = null;
            return this.env;
          }
        } catch (error) {
          console.error('Failed to load config synchronously:', error);
          this.env = null;
          return this.env;
        }
    }
}

@Injectable({
    providedIn: 'root'
})
export abstract class ViesRestService<T extends Object> extends ViesService {

    constructor(httpClient: HttpClient) {
        super(httpClient);
    }

    abstract newBlankObject(): T;
    abstract getIdFieldValue(object: T): any;
    abstract setIdFieldValue(object: T, id: any): void;

    public getAll(matchBy?: MatchByEnum, matchCase?: MatchCaseEnum, matchTo?: T): Observable<T[]> {
        if (matchBy && matchCase && matchTo) {
            return this.complexMatch(matchBy, matchCase, matchTo);
        }
        else {
            return this.httpClient.get<T[]>(`${this.getPrefixUri()}`).pipe(map(data => data ?? [])).pipe(first());
        }
    }

    public getAllPageable(page: number, size: number, sort?: string, matchBy?: MatchByEnum, matchCase?: MatchCaseEnum, matchTo?: T): Observable<Pageable<T>> {
        let params = new HttpParamsBuilder();
        params.set('page', page);
        params.set('size', size);
        params.setIfValid('sort', sort);

        if (matchBy && matchCase && matchTo) {
            return this.complexMatchPageable(matchBy, matchCase, matchTo, page, size, sort);
        }

        return this.httpClient.get<Pageable<T>>(`${this.getPrefixUri()}`, { params: params.build() }).pipe(first());
    }

    public getAllPageableNoSort(page: number, size: number, matchBy?: MatchByEnum, matchCase?: MatchCaseEnum, matchTo?: T): Observable<Pageable<T>> {
        return this.getAllPageable(page, size, "", matchBy, matchCase, matchTo);
    }

    public complexMatch(matchBy: MatchByEnum, matchCase: MatchCaseEnum, matchTo: T): Observable<T[]> {
        let params = new HttpParamsBuilder();
        params.set("matchBy", matchBy);
        params.set("matchCase", matchCase);
        return this.httpClient.post<T[]>(`${this.getPrefixUri()}/matches`, matchTo, { params: params.build() }).pipe(first());
    }

    public complexMatchPageable(matchBy: MatchByEnum, matchCase: MatchCaseEnum, matchTo: T, page: number, size: number, sort?: string): Observable<Pageable<T>> {
        let params = new HttpParamsBuilder();
        params.set("matchBy", matchBy);
        params.set("matchCase", matchCase);
        params.set('page', page);
        params.set('size', size);
        params.setIfValid('sort', sort);
        return this.httpClient.post<Pageable<T>>(`${this.getPrefixUri()}/matches`, matchTo, { params: params.build() }).pipe(first());
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

        return matDialog.open(ObjectDialog, { data: objectDialogData, width: '100%' }).afterClosed();
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
        if (typeof id === 'string')
            return parseInt(id);
        else
            return id;
    }
}
