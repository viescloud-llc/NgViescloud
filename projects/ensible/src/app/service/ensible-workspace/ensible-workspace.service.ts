import { EnsibleItemTrigger, EnsiblePlaybookLogger, EnsiblePlayBookTrigger, EnsibleProcessLogger, EnsibleShellLogger, EnsibleShellTrigger } from './../../model/ensible.model';
import { Injectable } from '@angular/core';
import { first, firstValueFrom, Observable, Subject } from 'rxjs';
import { FSNode, FSTree } from '../../model/ensible.model';
import { HttpParamsBuilder } from 'projects/viescloud-utils/src/lib/model/utils.model';
import { ViesService } from 'projects/viescloud-utils/src/lib/service/rest.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export abstract class EnsibleWorkspaceService<T extends EnsibleItemTrigger, PL extends EnsibleProcessLogger> extends ViesService {
  
  constructor(httpClient: HttpClient) {
    super(httpClient);
  }

  abstract runCommand(itemTrigger: T): Observable<string>;
  runCommandAndGetLog(itemTrigger: T):  Observable<PL> {
    let params = new HttpParamsBuilder();
    params = params.set('itemId', itemTrigger.itemId);
    params = params.setIfValid('outputTopic', itemTrigger.outputTopic);
    params = params.setIfValid('consumeEverything', itemTrigger.consumeEverything);
    params = params.setIfValid('verbosity', itemTrigger.verbosity);
    let httpParams = params.build();
    return this.httpClient.post<PL>(`${this.getPrefixUri()}/run/log`, null, {params: httpParams});
  }
}

//----------------------------------Ansible----------------------------------

@Injectable({
  providedIn: 'root'
})
export class EnsibleAnsibleWorkspaceService extends EnsibleWorkspaceService<EnsiblePlayBookTrigger, EnsiblePlaybookLogger> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'ansible', 'workspaces'];
  }

  override runCommand(playbookTrigger: EnsiblePlayBookTrigger): Observable<string> {
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

    return this.httpClient.post(`${this.getPrefixUri()}/run`, null, {params: httpParams, responseType: 'text'});
  }

  override runCommandAndGetLog(playbookTrigger: EnsiblePlayBookTrigger): Observable<EnsiblePlaybookLogger> {
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

    return this.httpClient.post<EnsiblePlaybookLogger>(`${this.getPrefixUri()}/run/log`, null, {params: httpParams});
  }

  createTemplate() {
    return this.httpClient.put<FSTree>(`${this.getPrefixUri()}/template`, null);
  }
}

//----------------------------------Shell----------------------------------

@Injectable({
  providedIn: 'root'
})
export class EnsibleShellWorkspaceService extends EnsibleWorkspaceService<EnsibleShellTrigger, EnsibleShellLogger> {

  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'shell', 'workspaces'];
  }

  override runCommand(itemTrigger: EnsibleShellTrigger): Observable<string> {
    let params = new HttpParamsBuilder();
    if(itemTrigger.itemId) {
      params = params.setIfValid('itemId', itemTrigger.itemId);
    } else {
      params = params.setIfValid('type', itemTrigger.type);
      params = params.setIfValid('code', itemTrigger.code);
      params = params.setIfValid('codeFilePath', itemTrigger.codeFilePath);
      params = params.setIfValid('runCodeFilePath', itemTrigger.runCodeFilePath ?? false);
    }

    params = params.setIfValid('outputTopic', itemTrigger.outputTopic);
    params = params.setIfValid('consumeEverything', itemTrigger.consumeEverything);
    params = params.setIfValid('verbosity', itemTrigger.verbosity);

    let httpParams = params.build();
    let body = itemTrigger.code ?? null; 

    return this.httpClient.post(`${this.getPrefixUri()}/run`, body, {params: httpParams, responseType: 'text'});
  }
}