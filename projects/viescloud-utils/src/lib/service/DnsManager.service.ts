import { Injectable } from "@angular/core";
import { ViesRestService, ViesService } from "./Rest.service";
import { DnsRecord, NginxCertificate } from "../model/DnsManager.model";
import { Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";

@Injectable({
    providedIn: 'root',
})
export class DnsManagerService extends ViesService {

    constructor(
        private httpClient: HttpClient
    ) {
        super();
    }

    protected override getPrefixes(): string[] {
        return ['dns-manager', 'dns'];
    }

    public getAllDnsRecords(): Observable<DnsRecord[]> {
        return this.httpClient.get<DnsRecord[]>(`${this.getPrefixUri()}`);
    }

    public getAllCertificate(type: string): Observable<NginxCertificate[]> {
        return this.httpClient.get<NginxCertificate[]>(`${this.getPrefixUri()}/nginx/certificates/${type}`);
    }

    public putDnsRecord(record: DnsRecord): Observable<void> {
        return this.httpClient.put<void>(`${this.getPrefixUri()}`, record);
    }

    public clearCache(): Observable<void> {
        return this.httpClient.delete<void>(`${this.getPrefixUri()}/clear-cache`);
    }

    public deleteDnsRecord(uri: string): Observable<void> {
        return this.httpClient.delete<void>(`${this.getPrefixUri()}?uri=${uri}`);
    }
}