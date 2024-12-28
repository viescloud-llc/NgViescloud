import { EnsibleService } from '../ensible/ensible.service';
import { DatabaseStorageServiceV1 } from './../../../../../viescloud-utils/src/lib/service/ObjectStorageManager.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EnsibleDatabaseObjectStorageService extends DatabaseStorageServiceV1 {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'databases'];
  }

  protected override getURI(): string {
    return EnsibleService.getUri();
  }
}
