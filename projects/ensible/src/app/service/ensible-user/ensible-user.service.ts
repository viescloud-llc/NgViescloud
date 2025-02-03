import { Injectable } from '@angular/core';
import { EnsibleRestService, EnsibleService } from '../ensible/ensible.service';
import { EnsibleUser } from '../../model/ensible.model';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/Mat.model';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EnsibleUserService extends EnsibleRestService<EnsibleUser> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'users'];
  }

  getAllPublicUser() {
    return this.httpClient.get<EnsibleUser[]>(`${this.getPrefixUri()}/public`);
  }

  getAllPublicUserIdOptions() {
    return this.getAllPublicUser().pipe(map(res => {
      let options: MatOption<string>[] = [];
      res.forEach(e => {
        options.push({
          value: e.id + '',
          valueLabel: `id: ${e.id} - ${e.alias}`
        });
      })
      return options;
    }))
  }
}
