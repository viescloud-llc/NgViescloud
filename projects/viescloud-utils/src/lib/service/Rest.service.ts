import { Observable, first, firstValueFrom } from "rxjs";
import HttpClientUtils from "../model/HttpClientUtils.model";
import { HttpClient } from "@angular/common/http";
import { UtilsService } from "./Utils.service";
import { environment } from "projects/environments/environment.prod";
import { PropertyMatcherEnum } from "../model/Mat.model";
import { MatDialog } from "@angular/material/dialog";
import { ObjectDialog, ObjectDialogData } from "../dialog/object-dialog/object-dialog.component";
import { Injectable } from "@angular/core";
import { RxJSUtils } from "../util/RxJS.utils";

export abstract class ViesService {
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

    public getPrefixUri(): string {
        return `${this.getURI()}${this.getPrefixPath()}`;
    }
}

@Injectable({
    providedIn: 'root'
})
export abstract class ViesRestService<T extends Object> extends ViesService {

    constructor(protected httpClient: HttpClient) {
        super();
    }

    public getAnyMatch(object: T): Observable<T[]> {
        let params = HttpClientUtils.toHttpParams(object);
        return this.httpClient.get<T[]>(`${this.getPrefixUri()}/match_any`, { params: params }).pipe(first());
    }

    public getAllMatch(object: T): Observable<T[]> {
        let params = HttpClientUtils.toHttpParams(object);
        return this.httpClient.get<T[]>(`${this.getPrefixUri()}/match_all`, { params: params }).pipe(first());
    }

    public getAnyMatchWithMatchCase(object: T, matchCase: string | PropertyMatcherEnum): Observable<T[]> {
        let params = HttpClientUtils.toHttpParams(object);
        return this.httpClient.get<T[]>(`${this.getPrefixUri()}/match_any/${matchCase}`, { params: params }).pipe(first());
    }

    public getAllMatchWithMatchCase(object: T, matchCase: string | PropertyMatcherEnum): Observable<T[]> {
        let params = HttpClientUtils.toHttpParams(object);
        return this.httpClient.get<T[]>(`${this.getPrefixUri()}/match_all/${matchCase}`, { params: params }).pipe(first());
    }

    public getAll(): Observable<T[]> {
        return this.httpClient.get<T[]>(`${this.getPrefixUri()}`).pipe(first());
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
        return id ? this.put(id, object) : this.post(object);
    }

    public postOrPatch(id: any, object: T): Observable<T> {
        return id ? this.patch(id, object) : this.post(object);
    }
}
