import { Injectable } from '@angular/core';
import { EnsibleRestService } from '../ensible/ensible.service';
import { EnsibleItem, EnsiblePlaybookItem, EnsibleShellItem } from '../../model/ensible.model';
import { PathNode } from 'projects/viescloud-utils/src/lib/model/Mat.model';
import { HttpParamsBuilder } from 'projects/viescloud-utils/src/lib/model/Utils.model';
import { first, map, retry } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export abstract class EnsibleItemService<T extends EnsibleItem> extends EnsibleRestService<T> {
  abstract newEmptyItem(): T;

  getItemByPath(path: string) {
    let params = new HttpParamsBuilder();
    params.setIfValid("path", path)
    return this.httpClient.get<PathNode<T>[]>(`${this.getPrefixUri()}/path`, { params: params.build() })
    .pipe(map(e => {
      let arr: T[] = [];
      e.forEach(node => {
        if (node.value) {
          arr.push(node.value);
        }
        else {
          let empty = this.newEmptyItem();
          empty.name = 'Estimate Path';
          empty.path = node.path;
          arr.push(empty);
        }
      });

      return arr;
    })).pipe(first());
  }
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
