import { Injectable } from '@angular/core';
import { EnsibleRestService } from '../ensible/ensible.service';
import { EnsiblePlayBookLogger } from '../../model/ensible.model';

@Injectable({
  providedIn: 'root'
})
export class EnsiblePlaybookLoggerService extends EnsibleRestService<EnsiblePlayBookLogger> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'playbook', 'loggers'];
  }

  getAllByItemId(itemId: number) {
    return this.httpClient.get<EnsiblePlayBookLogger[]>(`${this.getPrefixUri()}/item/${itemId}`);
  }

  getByItemIdAndRunNumber(itemId: number, runNumber: number) {
    return this.httpClient.get<EnsiblePlayBookLogger>(`${this.getPrefixUri()}/item/${itemId}/run/${runNumber}`);
  }
}
