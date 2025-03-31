import { Injectable } from '@angular/core';
import { EnsibleRestService } from '../ensible/ensible.service';
import { EnsiblePlaybookItem } from '../../model/ensible.model';

@Injectable({
  providedIn: 'root'
})
export abstract class EnsibleItemService<T extends EnsiblePlaybookItem> extends EnsibleRestService<T> {

}

@Injectable({
  providedIn: 'root'
})
export class EnsiblePlaybookItemService extends EnsibleItemService<EnsiblePlaybookItem> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'playbook', 'items']
  }
}

@Injectable({
  providedIn: 'root'
})
export class EnsibleShellItemService extends EnsibleItemService<EnsiblePlaybookItem> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'shell', 'items']
  }
}
