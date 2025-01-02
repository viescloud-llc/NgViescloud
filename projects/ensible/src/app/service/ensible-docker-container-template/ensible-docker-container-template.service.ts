import { Injectable } from '@angular/core';
import { EnsibleRestService, EnsibleService } from '../ensible/ensible.service';
import { EnsibleDockerContainerTemplate } from '../../model/ensible.model';

@Injectable({
  providedIn: 'root'
})
export class EnsibleDockerContainerTemplateService extends EnsibleRestService<EnsibleDockerContainerTemplate> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'docker', 'container', 'templates'];
  }

}
