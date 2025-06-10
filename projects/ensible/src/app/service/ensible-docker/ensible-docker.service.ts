import { RxJSUtils } from './../../../../../viescloud-utils/src/lib/util/RxJS.utils';
import { Injectable } from '@angular/core';
import { EnsibleService } from '../ensible/ensible.service';
import { firstValueFrom } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { EnsibleDockerContainer, EnsibleItemTypeEnum } from '../../model/ensible.model';
import { HttpParamsBuilder } from 'projects/viescloud-utils/src/lib/model/utils.model';

@Injectable({
  providedIn: 'root'
})
export class EnsibleDockerService extends EnsibleService {

  constructor(
    httpClient: HttpClient,
    private rxJSUtils: RxJSUtils
  ) {
    super(httpClient);
  }

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'dockers'];
  }

  async isDockerRunning() {
    let result = await firstValueFrom(this.httpClient.get<{running: boolean}>(`${this.getPrefixUri()}/running`).pipe(this.rxJSUtils.waitLoadingDynamicMessagePopup('Checking if docker engine is running')));
    return result.running;
  }

  getContainers() {
    return this.httpClient.get<EnsibleDockerContainer[]>(`${this.getPrefixUri()}/containers`);
  }

  pullImage(imageName: string, outputTopic: string, consumeEverything: boolean = true) {
    let params = new HttpParamsBuilder();
    params.set('imageName', imageName);
    params.setIfValid('outputTopic', outputTopic);
    params.setIf('consumeEverything', consumeEverything, v => !!outputTopic);

    return this.httpClient.post(`${this.getPrefixUri()}/image/pull`, null, {params: params.build(), responseType: 'text'});
  }

  deleteContainerByItemId(type: EnsibleItemTypeEnum, itemId: string | number) {
    let params = new HttpParams().set('itemId', itemId).set('type', type);
    return this.httpClient.delete(`${this.getPrefixUri()}/container`, {params: params});
  }

  readyContainerByItemId(type: EnsibleItemTypeEnum, itemId: string | number, outputTopic?: string, consumeEverything: boolean = true) {
    let params = new HttpParamsBuilder();
    params.setIfValid('outputTopic', outputTopic);
    params.setIfValid('consumeEverything', consumeEverything);
    params.setIfValid('type', type);

    return this.httpClient.put(`${this.getPrefixUri()}/container/ready/item/${itemId}`, null, {params: params.build(), responseType: 'text'});
  }
}
