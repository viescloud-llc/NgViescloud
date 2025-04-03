import { Injectable } from '@angular/core';
import { EnsibleRestService } from '../ensible/ensible.service';
import { EnsibleItem, EnsiblePlaybookItem, EnsibleShellItem } from '../../model/ensible.model';

@Injectable({
  providedIn: 'root'
})
export abstract class EnsibleItemService<T extends EnsibleItem> extends EnsibleRestService<T> {
  abstract newEmptyItem(): T;
}

@Injectable({
  providedIn: 'root'
})
export class EnsiblePlaybookItemService extends EnsibleItemService<EnsiblePlaybookItem> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'playbook', 'items']
  }

  override newEmptyItem(): EnsiblePlaybookItem {
    return new EnsiblePlaybookItem();
  }
}

@Injectable({
  providedIn: 'root'
})
export class EnsibleShellItemService extends EnsibleItemService<EnsibleShellItem> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'shell', 'items']
  }

  override newEmptyItem(): EnsibleShellItem {
    return new EnsibleShellItem();
  }
}
