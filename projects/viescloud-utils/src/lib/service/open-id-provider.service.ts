import { Injectable } from "@angular/core";
import { ViesRestService } from "./rest.service";
import { HttpClient, HttpParams } from "@angular/common/http";
import { OpenIDProvider, OpenIdWellKnown } from "../model/open-id.model";

@Injectable({
    providedIn: 'root',
})
export class OpenIdProviderService extends ViesRestService<OpenIDProvider> {

    constructor(httpClient: HttpClient) {
        super(httpClient);
    }

    protected override getPrefixes(): string[] {
        return ['api', 'v1', 'open', 'id', 'providers'];
    }

    getWellKnown(url: string) {
        let params = new HttpParams().set('url', url);
        return this.httpClient.get<OpenIdWellKnown>(`${this.getPrefixUri()}/well-known`, { params: params });
    }

    getAllPublicProviders() {
        return this.httpClient.get<OpenIDProvider[]>(`${this.getPrefixUri()}/public`);
    }
}