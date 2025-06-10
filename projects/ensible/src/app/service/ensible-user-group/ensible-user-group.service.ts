import { Injectable } from '@angular/core';
import { EnsibleRestService } from '../ensible/ensible.service';
import { EnsibleUserGroup } from '../../model/ensible.model';
import { map, reduce } from 'rxjs';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/mat.model';

@Injectable({
  providedIn: 'root'
})
export class EnsibleUserGroupService extends EnsibleRestService<EnsibleUserGroup> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'user', 'groups'];
  }

  getAllPublicGroupIdOptions() {
    return this.getAll().pipe(map(res => {
      let options: MatOption<string>[] = [];
      res.forEach(e => {
        options.push({
          value: e.id + '',
          valueLabel: e.name
        });
      })
      return options;
    }))
  }
}
