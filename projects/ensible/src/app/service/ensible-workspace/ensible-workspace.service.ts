import { RxJSUtils } from './../../../../../viescloud-utils/src/lib/util/RxJS.utils';
import { EnsibleItemTrigger, EnsiblePlayBookTrigger, EnsibleShellTrigger } from './../../model/ensible.model';
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
export abstract class EnsibleWorkspaceService<T extends EnsibleItemTrigger> extends EnsibleService {
  abstract triggerPlaybook(itemTrigger: T): Observable<string>;
}

//----------------------------------Ansible----------------------------------

@Injectable({
  providedIn: 'root'
})
export class EnsibleAnsibleWorkspaceService extends EnsibleWorkspaceService<EnsiblePlayBookTrigger> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'ansible', 'workspaces'];
  }

  override triggerPlaybook(playbookTrigger: EnsiblePlayBookTrigger): Observable<string> {
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

@Injectable({
  providedIn: 'root'
})
export class EnsibleShellWorkspaceService extends EnsibleWorkspaceService<EnsibleShellTrigger> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'shell', 'workspaces'];
  }

  override triggerPlaybook(itemTrigger: EnsibleShellTrigger): Observable<string> {
    let params = new HttpParamsBuilder();
    if(itemTrigger.itemId) {
      params = params.setIfValid('itemId', itemTrigger.itemId);
    } else {
      params = params.setIfValid('type', itemTrigger.type);
      params = params.setIfValid('code', itemTrigger.code);
      params = params.setIfValid('codeFilePath', itemTrigger.codeFilePath);
    }

    params = params.setIfValid('outputTopic', itemTrigger.outputTopic);
    params = params.setIfValid('consumeEverything', itemTrigger.consumeEverything);
    params = params.setIfValid('verbosity', itemTrigger.verbosity);

    let httpParams = params.build();

    return this.httpClient.post(`${this.getPrefixUri()}/playbook`, null, {params: httpParams, responseType: 'text'});
  }
}