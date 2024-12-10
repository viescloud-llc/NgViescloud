import { Injectable } from '@angular/core';
import { EnsibleRestService } from '../ensible/ensible.service';
import { EnsibleUserGroup } from '../../model/ensible.model';

@Injectable({
  providedIn: 'root'
})
export class EnsibleUserGroupService extends EnsibleRestService<EnsibleUserGroup> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'user', 'groups'];
  }

}
