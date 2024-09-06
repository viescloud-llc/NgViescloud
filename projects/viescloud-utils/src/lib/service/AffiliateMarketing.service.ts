import { Injectable } from '@angular/core';
import { Category, Product, PinterestOathToken } from '../model/AffiliateMarketing.model';
import { HttpClient } from '@angular/common/http';
import { ViesRestService, ViesService } from './Rest.service';
import { Observable, first } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService extends ViesRestService<Product> {
  protected override getPrefixes(): string[] {
    return ['affiliate_marketing', 'api', 'v1', 'products'];
  }

  constructor(httpClient: HttpClient) {
    super(httpClient);
  }
}

@Injectable({
  providedIn: 'root'
})
export class ProductCategoryService extends ViesRestService<Category> {
  protected override getPrefixes(): string[] {
    return ['affiliate_marketing', 'api', 'v1', 'categories'];
  }

  constructor(httpClient: HttpClient) {
    super(httpClient);
  }
}

@Injectable({
  providedIn: 'root'
})
export class PinterestOathTokenService extends ViesRestService<PinterestOathToken> {

  pinterestOathToken?: PinterestOathToken;

  protected override getPrefixes(): string[] {
    return ['affiliate_marketing', 'api', 'v1', 'oath', 'token', 'pinterests'];
  }

  constructor(httpClient: HttpClient) {
    super(httpClient);
    this.getLatestToken().subscribe({
      next: (data) => {
        this.pinterestOathToken = data;
      }
    });
  }

  public getLatestToken(): Observable<PinterestOathToken> {
    return this.httpClient.get<PinterestOathToken>(`${this.getURI()}${this.getPrefixPath()}/latest`).pipe(first());
  }
}

@Injectable({
  providedIn: 'root'
})
export class ViesPinterestService extends ViesService {

  constructor(
    private httpClient: HttpClient
  ) {
    super();
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