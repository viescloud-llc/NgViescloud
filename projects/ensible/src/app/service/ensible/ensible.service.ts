import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ensibleEnvironment } from 'projects/environments/ensible-environment.prod';
import { ViesRestService, ViesService } from 'projects/viescloud-utils/src/lib/service/Rest.service';

@Injectable({
  providedIn: 'root'
})
export abstract class EnsibleService extends ViesService {

  constructor(
    protected httpClient: HttpClient
  ) {
    super();
  }

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
