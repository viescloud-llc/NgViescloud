import { Injectable } from '@angular/core';
import { EnsibleRestService } from '../ensible/ensible.service';
import { EnsibleOpenIDProvider } from '../../model/ensible.model';
import { HttpParams } from '@angular/common/http';
import { OpenIdWellKnown } from 'projects/viescloud-utils/src/lib/model/OpenId.model';

@Injectable({
  providedIn: 'root'
})
export class EnsibleOpenIdProviderService extends EnsibleRestService<EnsibleOpenIDProvider> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'open', 'id', 'providers'];
  }

  getWellKnown(url: string) {
    let params = new HttpParams().set('url', url);
    return this.httpClient.get<OpenIdWellKnown>(`${this.getPrefixUri()}/well-known`, {params: params});
  }

  getAllPublicProviders() {
    return this.httpClient.get<EnsibleOpenIDProvider[]>(`${this.getPrefixUri()}/public`);
  }
}
