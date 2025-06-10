import { Injectable } from "@angular/core";
import { ViesRestService, ViesService } from "./rest.service";
import { DnsRecord, NginxCertificate } from "../model/dns-manager.model";
import { Observable } from "rxjs";
import { HttpClient, HttpParams } from "@angular/common/http";

@Injectable({
    providedIn: 'root',
})
export class DnsManagerService extends ViesService {

    constructor(
        httpClient: HttpClient
    ) {
        super(httpClient);
    }

    protected override getPrefixes(): string[] {
        return ['dns-manager', 'dns'];
    }

    public getAllDnsRecords(): Observable<DnsRecord[]> {
        return this.httpClient.get<DnsRecord[]>(`${this.getPrefixUri()}`);
    }

    public getAllCertificate(type: string): Observable<NginxCertificate[]> {
        let params = new HttpParams().set('type', type);
        return this.httpClient.get<NginxCertificate[]>(`${this.getPrefixUri()}/nginx/certificates`, { params: params });
    }

    public putDnsRecord(record: DnsRecord, cleanUnusedCloudflareCnameDns: boolean = false): Observable<void> {
        let params = new HttpParams().set('cleanUnusedCloudflareCnameDns', cleanUnusedCloudflareCnameDns.toString());
        return this.httpClient.put<void>(`${this.getPrefixUri()}`, record, { params: params });
    }

    public clearCache(): Observable<void> {
        return this.httpClient.delete<void>(`${this.getPrefixUri()}/clear-cache`);
    }

    public cleanUnusedDnsRecords(): Observable<void> {
        return this.httpClient.delete<void>(`${this.getPrefixUri()}/clear-unused-dns}`);
    }

    public deleteDnsRecord(uri: string, cleanUnusedCloudflareCnameDns: boolean = false): Observable<void> {
        let params = new HttpParams()
                        .set('cleanUnusedCloudflareCnameDns', cleanUnusedCloudflareCnameDns.toString())
                        .set('uri', uri);
        return this.httpClient.delete<void>(`${this.getPrefixUri()}`, { params: params });
    }
}