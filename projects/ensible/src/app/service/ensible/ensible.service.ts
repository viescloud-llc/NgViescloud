import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ensibleEnvironment } from 'projects/environments/ensible-environment.prod';
import { ViesRestService, ViesService } from 'projects/viescloud-utils/src/lib/service/Rest.service';
import { RouteUtils } from 'projects/viescloud-utils/src/lib/util/Route.utils';

@Injectable({
  providedIn: 'root'
})
export abstract class EnsibleService extends ViesService {

  constructor(
    httpClient: HttpClient
  ) {
    super(httpClient);
  }

  protected override getURI(): string {
    return EnsibleService.getUri();
  }

  static override getParseUri() {
    if(ensibleEnvironment.env === 'prod')
      return RouteUtils.getCurrentSchemasHostPortParsed();
    else
      return RouteUtils.parseUrl(ensibleEnvironment.api);
  }

  static override getUri() {
    if(ensibleEnvironment.env === 'prod')
      return RouteUtils.getCurrentSchemasHostPort();
    else
      return ensibleEnvironment.api;
  }
}

@Injectable({
  providedIn: 'root'
})
export abstract class EnsibleRestService<T extends Object> extends ViesRestService<T> {

  protected override getURI(): string {
    return EnsibleService.getUri();
  }
}
