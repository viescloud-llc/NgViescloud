import { Injectable } from '@angular/core';
import { EnsibleRestService } from '../ensible/ensible.service';
import { EnsibleItem } from '../../model/ensible.model';

@Injectable({
  providedIn: 'root'
})
export class EnsibleItemService extends EnsibleRestService<EnsibleItem> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'playbook', 'items']
  }
}
