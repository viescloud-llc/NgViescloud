import { RxJSUtils } from './../../../../../viescloud-utils/src/lib/util/RxJS.utils';
import { Injectable } from '@angular/core';
import { EnsibleService } from '../ensible/ensible.service';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { EnsibleDockerContainer } from '../../model/ensible.model';
import { HttpParamsBuilder } from 'projects/viescloud-utils/src/lib/model/Utils.model';

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
    let result = await firstValueFrom(this.httpClient.get<{running: boolean}>(`${this.getPrefixUri()}/running`).pipe(this.rxJSUtils.waitLoadingDialog()));
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
}
