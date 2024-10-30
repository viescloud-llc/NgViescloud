import { Injectable } from "@angular/core";
import { ViesRestService, ViesService } from "./Rest.service";
import { DnsRecord } from "../model/DnsManager.model";

@Injectable({
    providedIn: 'root',
})
export class DnsManagerService extends ViesRestService<DnsRecord> {

    protected override getPrefixes(): string[] {
        return ['dns-manager', 'dns'];
    }

}