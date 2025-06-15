import { Injectable } from "@angular/core";
import { ViesRestService, ViesService } from "projects/viescloud-utils/src/lib/service/rest.service";
import { DnsRecord, DnsSetting, NginxCertificate, NginxRecord } from "../model/dns.model";
import { HttpClient, HttpParams } from "@angular/common/http";
import { first, Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class DnsSettingService extends ViesRestService<DnsSetting> {

    override newBlankObject(): DnsSetting {
        return new DnsSetting();
    }

    override getIdFieldValue(object: DnsSetting) {
        return object.id;
    }

    override setIdFieldValue(object: DnsSetting, id: any): void {
        object.id = id;
    }

    protected override getPrefixes(): string[] {
        return ['api', 'v1', 'dns', 'settings'];
    }
}

@Injectable({
    providedIn: 'root'
})
export class DnsManagerService extends ViesService {

    constructor(httpClient: HttpClient) {
        super(httpClient);
    }

    protected override getPrefixes(): string[] {

        return ['api', 'v1', 'dns', 'managers'];
    }

    private getSettingId(dnsSettingId: number | DnsSetting) {
        if(typeof dnsSettingId === 'number') {
            return dnsSettingId;
        }
        return dnsSettingId.id;
    }

    public getAllDnsRecords(dnsSettingId: number | DnsSetting): Observable<DnsRecord[]> {
        let id = this.getSettingId(dnsSettingId);
        return this.httpClient.get<DnsRecord[]>(`${this.getPrefixUri()}/${id}`);
    }

    public getAllCertificate(dnsSettingId: number | DnsSetting): Observable<NginxCertificate[]> {
        let id = this.getSettingId(dnsSettingId);
        return this.httpClient.get<NginxCertificate[]>(`${this.getPrefixUri()}/nginx/certificates/${id}`);
    }

    public putDnsRecord(dnsSettingId: number | DnsSetting, record: DnsRecord, cleanUnusedCloudflareCnameDns: boolean = false): Observable<void> {
        let id = this.getSettingId(dnsSettingId);
        let params = new HttpParams().set('cleanUnusedCloudflareCnameDns', cleanUnusedCloudflareCnameDns.toString());
        return this.httpClient.put<void>(`${this.getPrefixUri()}/${id}`, record, { params: params });
    }

    public clearCache(dnsSettingId: number | DnsSetting): Observable<void> {
        let id = this.getSettingId(dnsSettingId);
        return this.httpClient.delete<void>(`${this.getPrefixUri()}/clear-cache/${id}`);
    }

    public cleanUnusedDnsRecords(dnsSettingId: number | DnsSetting): Observable<void> {
        let id = this.getSettingId(dnsSettingId);
        return this.httpClient.delete<void>(`${this.getPrefixUri()}/clear-unused-dns/${id}`);
    }

    public deleteDnsRecord(dnsSettingId: number | DnsSetting, uri: string, cleanUnusedCloudflareCnameDns: boolean = false): Observable<void> {
        let id = this.getSettingId(dnsSettingId);
        let params = new HttpParams()
                        .set('cleanUnusedCloudflareCnameDns', cleanUnusedCloudflareCnameDns.toString())
                        .set('uri', uri);
        return this.httpClient.delete<void>(`${this.getPrefixUri()}/${id}`, { params: params });
    }
}