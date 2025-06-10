import { Injectable } from '@angular/core';
import { EnsibleService } from '../ensible/ensible.service';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EnsibleVaultService extends EnsibleService {
  protected override getPrefixes(): string[] {
    return ['api', 'v1', 'ansible', 'vaults'];
  }

  viewVault(vaultSecretFilePath: string, vaultPasswordFilePath?: string, vaultPassword?: string): Observable<string> {
    return this.httpClient.get(`${this.getPrefixUri()}`, {params: this.generateParams(vaultSecretFilePath, vaultPasswordFilePath, vaultPassword), responseType: 'text'});
  }

  createVault(vaultContent: string,vaultSecretFilePath: string, vaultPasswordFilePath?: string, vaultPassword?: string): Observable<string> {
    return this.httpClient.post(`${this.getPrefixUri()}`, vaultContent, {params: this.generateParams(vaultSecretFilePath, vaultPasswordFilePath, vaultPassword), responseType: 'text'});
  }

  modifyVault(vaultContent: string,vaultSecretFilePath: string, vaultPasswordFilePath?: string, vaultPassword?: string): Observable<string> {
    return this.httpClient.put(`${this.getPrefixUri()}`, vaultContent, {params: this.generateParams(vaultSecretFilePath, vaultPasswordFilePath, vaultPassword), responseType: 'text'});
  }

  private generateParams(vaultSecretFilePath: string, vaultPasswordFilePath?: string, vaultPassword?: string): HttpParams {
    let params = new HttpParams().set('vaultSecretsFile', vaultSecretFilePath);

    if (vaultPasswordFilePath) {
      params = params.set('vaultPasswordFile', vaultPasswordFilePath);
    } else if (vaultPassword) {
      params = params.set('vaultPassword', vaultPassword);
    }

    return params;
  }
}
