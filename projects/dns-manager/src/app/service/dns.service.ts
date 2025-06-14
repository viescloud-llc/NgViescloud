import { Injectable } from "@angular/core";
import { ViesRestService } from "projects/viescloud-utils/src/lib/service/rest.service";
import { DnsSetting } from "../model/dns.model";

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