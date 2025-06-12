import { Injectable } from '@angular/core';
import { EnsibleDockerContainerTemplate } from '../../model/ensible.model';
import { ViesRestService } from 'projects/viescloud-utils/src/lib/service/rest.service';

@Injectable({
  providedIn: 'root'
})
export class EnsibleDockerContainerTemplateService extends ViesRestService<EnsibleDockerContainerTemplate> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'docker', 'container', 'templates'];
  }

}
