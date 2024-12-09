import { Injectable } from '@angular/core';
import { EnsibleRestService, EnsibleService } from '../ensible/ensible.service';
import { EnsibleUser } from '../../model/ensible.model';

@Injectable({
  providedIn: 'root'
})
export class EnsibleUserService extends EnsibleRestService<EnsibleUser> {
  
  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'users'];
  }
}
