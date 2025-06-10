import { Injectable } from '@angular/core';
import { EnsibleService } from '../ensible/ensible.service';
import { HttpParams } from '@angular/common/http';
import { HttpParamsBuilder } from 'projects/viescloud-utils/src/lib/model/utils.model';

@Injectable({
  providedIn: 'root'
})
export class EnsibleProcessService extends EnsibleService {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'processes'];
  }

  watchProcessByTopic(topic: string, waitMs?: number) {
    let params = new HttpParamsBuilder();
    params.set('topic', topic);
    params.setIfValid('waitMs', waitMs)
    return this.httpClient.get(`${this.getPrefixUri()}`, {params: params.build(), responseType: 'text'});
  }

  stopProcessByTopic(topic: string) {
    let params = new HttpParams().set('topic', topic);
    return this.httpClient.delete(`${this.getPrefixUri()}`, {params: params});
  }

}
