import { Injectable } from '@angular/core';
import { EnsibleRestService } from '../ensible/ensible.service';
import { EnsiblePlaybookLogger, EnsibleProcessLogger, EnsibleShellLogger } from '../../model/ensible.model';
import { HttpParamsBuilder } from 'projects/viescloud-utils/src/lib/model/utils.model';
import { Pageable } from 'projects/viescloud-utils/src/lib/model/mat.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export abstract class EnsibleProcessLoggerService<T extends EnsibleProcessLogger> extends EnsibleRestService<T> {
  getAllByItemId(itemId: number) {
    return this.httpClient.get<EnsiblePlaybookLogger[]>(`${this.getPrefixUri()}/item/${itemId}`);
  }

  getAllByItemIdOptimize(itemId: number) {
    return this.httpClient.get<EnsiblePlaybookLogger[]>(`${this.getPrefixUri()}/item/${itemId}/optimize`);
  }

  getAllByItemIdOptimizePage(itemId: number, page: number, size: number, sort?: string): Observable<Pageable<T>> {
    let params = new HttpParamsBuilder();
    params.set('page', page);
    params.set('size', size);
    params.setIfValid('sort', sort);
    return this.httpClient.get<Pageable<T>>(`${this.getPrefixUri()}/item/${itemId}/optimize`, {params: params.build()});
  }

  getByItemIdAndRunNumber(itemId: number, runNumber: number) {
    return this.httpClient.get<EnsiblePlaybookLogger>(`${this.getPrefixUri()}/item/${itemId}/run/${runNumber}`);
  }

  abstract newEmptyObject(): T;
}

@Injectable({
  providedIn: 'root'
})
export class EnsiblePlaybookLoggerService extends EnsibleProcessLoggerService<EnsiblePlaybookLogger> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'playbook', 'loggers'];
  }

  override newEmptyObject(): EnsiblePlaybookLogger {
    return new EnsiblePlaybookLogger();
  }
}

@Injectable({
  providedIn: 'root'
})
export class EnsibleShellLoggerService extends EnsibleProcessLoggerService<EnsibleShellLogger> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'shell', 'loggers'];
  }

  override newEmptyObject(): EnsibleShellLogger {
    return new EnsibleShellLogger();
  }
}