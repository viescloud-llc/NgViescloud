import { Injectable } from '@angular/core';
import { ensibleEnvironment } from 'projects/environments/ensible-environment.prod';
import { ViesRestService, ViesService } from 'projects/viescloud-utils/src/lib/service/Rest.service';

export abstract class EnsibleService extends ViesService {
  protected override getURI(): string {
    return ensibleEnvironment.api;
  }
}

@Injectable({
  providedIn: 'root'
})
export abstract class EnsibleRestService<T extends Object> extends ViesRestService<T> {
  protected override getURI(): string {
    return ensibleEnvironment.api;
  }
}