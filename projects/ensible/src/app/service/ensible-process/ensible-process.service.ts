import { Injectable } from '@angular/core';
import { EnsibleService } from '../ensible/ensible.service';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class EnsibleProcessService extends EnsibleService {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'processes'];
  }

  watchProcessByTopic(topic: string) {
    let params = new HttpParams().set('topic', topic);
    return this.httpClient.get(`${this.getPrefixUri()}`, {params: params, responseType: 'text'});
  }

  stopProcessByTopic(topic: string) {
    let params = new HttpParams().set('topic', topic);
    return this.httpClient.delete(`${this.getPrefixUri()}`, {params: params});
  }

}
