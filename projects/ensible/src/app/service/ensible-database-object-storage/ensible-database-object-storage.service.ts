import { ViesService } from 'projects/viescloud-utils/src/lib/service/rest.service';
import { DatabaseStorageServiceV1 } from '../../../../../viescloud-utils/src/lib/service/object-storage-manager.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EnsibleDatabaseObjectStorageService extends DatabaseStorageServiceV1 {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'databases'];
  }

  protected override getURI(): string {
    return ViesService.getUri();
  }
}
