import { Injectable } from '@angular/core';
import { Category, Product, PinterestOathToken, RegisterMediaResponse, MediaResponse } from '../model/AffiliateMarketing.model';
import { HttpClient } from '@angular/common/http';
import { ViesRestService, ViesService } from './rest.service';
import { Observable, first } from 'rxjs';
import { environment } from 'projects/environments/environment.prod';
import { DataUtils } from '../util/Data.utils';
import { StringUtils } from '../util/String.utils';
import { Router } from '@angular/router';
import { VFile } from './utils.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService extends ViesRestService<Product> {
  protected override getPrefixes(): string[] {
    return ['affiliate_marketing', 'api', 'v1', 'products'];
  }
}

@Injectable({
  providedIn: 'root'
})
export class ProductCategoryService extends ViesRestService<Category> {
  protected override getPrefixes(): string[] {
    return ['affiliate_marketing', 'api', 'v1', 'categories'];
  }
}

@Injectable({
  providedIn: 'root'
})
export class PinterestOathTokenService extends ViesRestService<PinterestOathToken> {

  private baseUri = environment.env !== 'prod' ? 'https://api-sandbox.com' : 'https://api.pinterest.com';
  private tokenUri = `${this.baseUri}/v5/oauth/token`;
  private oathUri = 'https://www.pinterest.com/oauth/';
  private mediaUri = `${this.baseUri}/v5/media`;

  pinterestOathToken?: PinterestOathToken;

  protected override getPrefixes(): string[] {
    return ['affiliate_marketing', 'api', 'v1', 'oath', 'token', 'pinterests'];
  }

  constructor(httpClient: HttpClient, private router: Router) {
    super(httpClient);
    this.getLatestToken().subscribe({
      next: (data) => {
        this.pinterestOathToken = data;
      }
    });
  }

  getLatestToken(): Observable<PinterestOathToken> {
    return this.httpClient.get<PinterestOathToken>(`${this.getURI()}${this.getPrefixPath()}/latest`).pipe(first());
  }

  authorizeFlow(): void {
    let oathUri = this.oathUri;
    let clientId = environment.pinterest_client_id;
    let responseType = 'code';
    // let scope = 'ads:read,ads:write,biz_access:read,biz_access:write,boards:read,boards:read_secret,boards:write,boards:write_secret,catalogs:read,catalogs:write,pins:read,pins:read_secret,pins:write,pins:write_secret,user_accounts:read';
    let scope = 'ads:read,ads:write,boards:read,boards:read_secret,boards:write,boards:write_secret,pins:read,pins:read_secret,pins:write,pins:write_secret,user_accounts:read';
    let redirectUrl = encodeURIComponent(this.getRedirectUri());
    let state = StringUtils.makeId(20);
    let authenticationUrl = `${oathUri}?client_id=${clientId}&response_type=${responseType}&scope=${scope}&redirect_uri=${redirectUrl}&state=${state}`;
    this.router.navigate(["/"]).then(result=>{window.location.href = authenticationUrl;});
  }

  getRedirectUri() {
    return `${window.location.protocol}//${window.location.host}/oath/pinterest`;
  }

  registerMedia() {
    if(this.pinterestOathToken) {
      let accessToken = this.pinterestOathToken.accessToken!;
      return this.httpClient.post<RegisterMediaResponse>(this.mediaUri, {media_type: 'video'}, {headers: {Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json'}});
    }
    else
      throw Error('Oath token can not be null');
  }

  getMedia(mediaId: string) {
    if(this.pinterestOathToken) {
      let accessToken = this.pinterestOathToken.accessToken!;
      return this.httpClient.get<MediaResponse>(`${this.mediaUri}/${mediaId}`, {headers: {Authorization: `Bearer ${accessToken}`}});
    }
    else
      throw Error('Oath token can not be null');
  }

  uploadMedia(registerMediaResponse: RegisterMediaResponse, vFile: VFile) {
    if(vFile.rawFile) {
      const formData = new FormData();
      formData.append('x-amz-date', registerMediaResponse.upload_parameters.get('x-amz-date') ?? '');
      formData.append('x-amz-signature', registerMediaResponse.upload_parameters.get('x-amz-signature') ?? '');
      formData.append('x-amz-security-token', registerMediaResponse.upload_parameters.get('x-amz-security-token') ?? '');
      formData.append('x-amz-algorithm', registerMediaResponse.upload_parameters.get('x-amz-algorithm') ?? '');
      formData.append('key', registerMediaResponse.upload_parameters.get('key') ?? '');
      formData.append('policy', registerMediaResponse.upload_parameters.get('policy') ?? '');
      formData.append('x-amz-credential', registerMediaResponse.upload_parameters.get('x-amz-credential') ?? '');
      formData.append('Content-Type', registerMediaResponse.upload_parameters.get('Content-Type') ?? '');
      registerMediaResponse.upload_parameters.forEach((value, key) => {
        if(!formData.has(key))
          formData.append(key, value);
      })

      formData.append('file', vFile.rawFile, vFile.name);

      return this.httpClient.post<any>(`${registerMediaResponse.upload_url}`, formData);
    }
    else
      throw Error('File can not be null');
  }
}

@Injectable({
  providedIn: 'root'
})
export class ViesPinterestService extends ViesService {

  constructor(
    httpClient: HttpClient
  ) {
    super(httpClient);
  }

  protected override getPrefixes(): string[] {
    return ['affiliate_marketing', 'api', 'v1', 'pinterests'];
  }

  uploadPin(productId: number, width?: number, height?: number) {
    if(width && height)
      return this.httpClient.put<Product>(`${this.getURI()}${this.getPrefixPath()}/pin/${productId}?width=${width}&height=${height}`, null);
    else
      return this.httpClient.put<Product>(`${this.getURI()}${this.getPrefixPath()}/pin/${productId}`, null);
  }

}