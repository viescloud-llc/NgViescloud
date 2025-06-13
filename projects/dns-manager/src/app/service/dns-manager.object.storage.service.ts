import { Injectable } from "@angular/core";
import { ObjectStorageService } from "projects/viescloud-utils/src/lib/service/object-storage-manager.service";

@Injectable({
  providedIn: 'root'
})
export class DnsManagerObjectStorageService extends ObjectStorageService {

    protected override getPrefixes(): string[] {
        return ['api', 'v1', 's3'];
    }
}