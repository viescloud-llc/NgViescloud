import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfigModel, JobRequest } from 'projects/viescloud-utils/src/lib/model/Venkins.model';
import { UtilsService } from 'projects/viescloud-utils/src/lib/service/Utils.service';
import { VenkinsService } from 'projects/viescloud-utils/src/lib/service/Venkins.service';

@Component({
  selector: 'app-venkins-home',
  templateUrl: './venkins-home.component.html',
  styleUrls: ['./venkins-home.component.scss']
})
export class VenkinsHomeComponent implements OnInit {

  configModels: ConfigModel[] = [];
  buildModelTemplate: any[] = [];
  jobRequest: JobRequest = {};
  jobRequests: any[] = [];

  constructor(
    private venkinsService: VenkinsService,
    private matDialog: MatDialog
  ) { }

  ngOnInit() {
    this.init();
  }

  init() {
    this.venkinsService.getConfigModels().pipe(UtilsService.waitLoadingDialog(this.matDialog)).subscribe(
      res => {  
        this.configModels = res;
      }
    );
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  updateBuildModel(configModel: ConfigModel) {
    this.buildModelTemplate = [];
    this.jobRequest = {
      configId: configModel.id,
      configName: configModel.name
    };
    for (const key of configModel.possibleReplaceKeys!) {
      this.buildModelTemplate.push([key, ""]);
    }
  }

  onBuildModel() {
    let replaceMap = {};
    for(const map of this.buildModelTemplate) {
      let key = map[0];
      let value = map[1];
      UtilsService.setField(replaceMap, key, value);
    }
    this.jobRequest.replaceMap = replaceMap;
  }

  addToList() {
    this.jobRequests.push(structuredClone(this.jobRequest));
  }

  getJsonJobRequest() {
    return JSON.stringify(this.jobRequest, null, "\t");
  }

  getJsonJobRequests() {
    return JSON.stringify(this.jobRequests, null, "\t");
  }
}
