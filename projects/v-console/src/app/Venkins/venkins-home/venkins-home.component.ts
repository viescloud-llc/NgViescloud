import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfigModel, JobRequest } from 'projects/viescloud-utils/src/lib/model/Venkins.model';
import { UtilsService } from 'projects/viescloud-utils/src/lib/service/Utils.service';
import { VenkinsService } from 'projects/viescloud-utils/src/lib/service/Venkins.service';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { PopupUtils } from 'projects/viescloud-utils/src/lib/util/Popup.utils';
import { ReflectionUtils } from 'projects/viescloud-utils/src/lib/util/Reflection.utils';

@Component({
  selector: 'app-venkins-home',
  templateUrl: './venkins-home.component.html',
  styleUrls: ['./venkins-home.component.scss']
})
export class VenkinsHomeComponent implements OnInit {

  configModels: ConfigModel[] = [];
  buildModelTemplate: any[] = [];
  jobRequest: JobRequest = {};
  jobRequests: JobRequest[] = [];
  undoJobRequests: {jobRequest: JobRequest, index: number}[] = [];

  constructor(
    private venkinsService: VenkinsService,
    private DialogUtils: DialogUtils,
    private popupUtils: PopupUtils
  ) { }

  ngOnInit() {
    this.init();
  }

  init() {
    this.venkinsService.getConfigModels().pipe(UtilsService.waitLoadingDialog(this.DialogUtils.matDialog)).subscribe(
      res => {  
        this.configModels = res;
      }
    );

    this.jobRequest = {
      path: this.jobRequest.path ?? '',
      jobName: this.jobRequest.jobName ?? ''
    };
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  updateBuildModel(configModel: ConfigModel) {
    this.jobRequest = {
      path: this.jobRequest.path ?? '',
      jobName: this.jobRequest.jobName ?? '',
      configId: configModel.id,
      configName: configModel.name
    };

    this.buildModelTemplate = [];
    for (const key of configModel.possibleReplaceKeys!) {
      this.buildModelTemplate.push([key, ""]);
    }

    let replaceMap = {};
    for(const map of this.buildModelTemplate) {
      let key = map[0];
      let value = map[1];
      ReflectionUtils.setField(replaceMap, key, value);
    }
    this.jobRequest.replaceMap = replaceMap;
  }

  addToList() {
    this.jobRequests.push(structuredClone(this.jobRequest));
  }

  getJsonJobRequest() {
    return JSON.stringify(this.jobRequest, null, "\t");
  }

  onJsonJobRequestChange(json: string) {
    try {
      this.jobRequest = JSON.parse(json);
    }
    catch(e) {
      this.popupUtils.openMessagePopup("Invalid JSON!", "Dismiss", 'top', 'right', 2000);
    }
  }

  getJsonJobRequests() {
    return JSON.stringify(this.jobRequests, null, "\t");
  }

  onJsonJobRequestsChange(json: string) {
    try {
      this.jobRequests = JSON.parse(json);
    }
    catch(e) {
      this.popupUtils.openMessagePopup("Invalid JSON!", "Dismiss", 'top', 'right', 2000);
    }
  }

  async clearList() {
    let confirm = await this.DialogUtils.openConfirmDialog("Clear List", "Are you sure?\nThis cannot be undone", "Yes", "No");
    if(confirm) {
      this.jobRequests = [];
      this.undoJobRequests = [];
    }
  }

  removeFirst() {
    let undo = this.jobRequests.shift();
    if(undo) {
      this.undoJobRequests.push({jobRequest: undo, index: 0});
    }
  }

  removeLast() {
    let undo = this.jobRequests.pop();
    if(undo) {
      this.undoJobRequests.push({jobRequest: undo, index: this.jobRequests.length});
    }
  }

  undo() {
    let undo = this.undoJobRequests.pop();
    if(undo) {
      this.jobRequests.splice(undo.index, 0, undo.jobRequest);
    }
  }
}
