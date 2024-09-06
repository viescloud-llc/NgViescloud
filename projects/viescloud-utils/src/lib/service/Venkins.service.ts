import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import HttpClientUtils from '../model/HttpClientUtils.model';
import { HttpClient } from '@angular/common/http';
import { SettingService } from './Setting.service';
import { ConfigModel } from '../model/Venkins.model';

@Injectable({
  providedIn: 'root'
})
export class VenkinsService {

  private prefix = "venkins";

  constructor(
    private httpClient: HttpClient,
    private settingService: SettingService,
  ) { }

  public getAnyMatchConfigModels(configModel: ConfigModel): Observable<ConfigModel[]> {
    let params = HttpClientUtils.toHttpParams(configModel);
    return this.httpClient.get<ConfigModel[]>(`${this.settingService.getGatewayUrl()}/${this.prefix}/configModels/match_any`, { params: params });
  }
  
  public getAllMatchConfigModels(configModel: ConfigModel): Observable<ConfigModel[]> {
    let params = HttpClientUtils.toHttpParams(configModel);
    return this.httpClient.get<ConfigModel[]>(`${this.settingService.getGatewayUrl()}/${this.prefix}/configModels/match_all`, { params: params });
  }
  
  public getAnyMatchConfigModelsWithMatchCase(configModel: ConfigModel, matchCase: string): Observable<ConfigModel[]> {
    let params = HttpClientUtils.toHttpParams(configModel);
    return this.httpClient.get<ConfigModel[]>(`${this.settingService.getGatewayUrl()}/${this.prefix}/configModels/match_any/${matchCase}`, { params: params });
  }
  
  public getAllMatchConfigModelsWithMatchCase(configModel: ConfigModel, matchCase: string): Observable<ConfigModel[]> {
    let params = HttpClientUtils.toHttpParams(configModel);
    return this.httpClient.get<ConfigModel[]>(`${this.settingService.getGatewayUrl()}/${this.prefix}/configModels/match_all/${matchCase}`, { params: params });
  }
  
  public getConfigModels(): Observable<ConfigModel[]> {
    return this.httpClient.get<ConfigModel[]>(`${this.settingService.getGatewayUrl()}/${this.prefix}/configModels`);
  }
  
  public getConfigModel(id: number): Observable<ConfigModel> {
    return this.httpClient.get<ConfigModel>(`${this.settingService.getGatewayUrl()}/${this.prefix}/configModels/${id}`);
  }
  
  public postConfigModel(configModel: ConfigModel): Observable<ConfigModel> {
    return this.httpClient.post<ConfigModel>(`${this.settingService.getGatewayUrl()}/${this.prefix}/configModels`, configModel);
  }
  
  public putConfigModel(configModel: ConfigModel): Observable<ConfigModel> {
    return this.httpClient.put<ConfigModel>(`${this.settingService.getGatewayUrl()}/${this.prefix}/configModels/${configModel.id}`, configModel);
  }
  
  public patchConfigModel(configModel: ConfigModel): Observable<ConfigModel> {
    return this.httpClient.patch<ConfigModel>(`${this.settingService.getGatewayUrl()}/${this.prefix}/configModels/${configModel.id}`, configModel);
  }
  
  public deleteConfigModel(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.settingService.getGatewayUrl()}/${this.prefix}/configModels/${id}`);
  }
}
