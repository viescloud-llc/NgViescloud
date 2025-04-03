import { RxJSUtils } from './../../../../../viescloud-utils/src/lib/util/RxJS.utils';
import { EnsiblePlayBookTrigger } from './../../model/ensible.model';
import { Injectable } from '@angular/core';
import { EnsibleService } from '../ensible/ensible.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { first, firstValueFrom, Observable, Subject } from 'rxjs';
import { FSNode, FSTree } from '../../model/ensible.model';
import { EnsibleFs, EnsibleRole, EnsibleFsDir, EnsibleWorkSpace } from '../../model/ensible.parser.model';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/Mat.model';
import { HttpParamsBuilder } from 'projects/viescloud-utils/src/lib/model/Utils.model';

@Injectable({
  providedIn: 'root'
})
export abstract class EnsibleWorkspaceService extends EnsibleService {

}

//----------------------------------Ansible----------------------------------

@Injectable({
  providedIn: 'root'
})
export class AnsibleWorkspaceService extends EnsibleWorkspaceService {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'ansible', 'workspaces'];
  }

  triggerPlaybook(playbookTrigger: EnsiblePlayBookTrigger) {
    let params = new HttpParamsBuilder();
    if(playbookTrigger.itemId) {
      params = params.setIfValid('itemId', playbookTrigger.itemId);
    } else {
      params = params.setIfValid('playbook', playbookTrigger.playbook);
      params = params.setIfValid('inventory', playbookTrigger.inventory);
      params = params.setIfValid('vaultSecretsFile', playbookTrigger.vaultSecretsFile);
      params = params.setIfValid('vaultPasswordFile', playbookTrigger.vaultPasswordFile);
      params = params.setIfValid('vaultPassword', playbookTrigger.vaultPassword);
    }

    params = params.setIfValid('outputTopic', playbookTrigger.outputTopic);
    params = params.setIfValid('consumeEverything', playbookTrigger.consumeEverything);
    params = params.setIfValid('verbosity', playbookTrigger.verbosity);

    let httpParams = params.build();

    return this.httpClient.post(`${this.getPrefixUri()}/playbook`, null, {params: httpParams, responseType: 'text'});
  }

  createTemplate() {
    return this.httpClient.put<FSTree>(`${this.getPrefixUri()}/template`, null);
  }
}

//----------------------------------Shell----------------------------------

