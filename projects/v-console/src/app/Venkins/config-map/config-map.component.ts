import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FixChangeDetection } from 'projects/viescloud-utils/src/lib/directive/FixChangeDetection';
import { ConfigModel, MatConfigModel } from 'projects/viescloud-utils/src/lib/model/venkins.model';
import { UtilsService } from 'projects/viescloud-utils/src/lib/service/utils.service';
import { VenkinsService } from 'projects/viescloud-utils/src/lib/service/venkins.service';
import { first } from 'rxjs';

@Component({
  selector: 'app-config-map',
  templateUrl: './config-map.component.html',
  styleUrls: ['./config-map.component.scss']
})
export class ConfigMapComponent extends FixChangeDetection implements OnInit {

  configModels: ConfigModel[] = [];
  matConfigModels: MatConfigModel[] = [];

  addConfigMapSwitch: boolean = false;

  detailConfigModel: ConfigModel = {id: 0,name: '', file: ''};

  validForm: boolean = false;

  constructor(
    private venkinsService: VenkinsService,
    private matDialog: MatDialog
  ) {
    super();
  }

  ngOnInit() {
    this.init();
  }

  init() {
    this.venkinsService.getConfigModels().pipe(UtilsService.waitLoadingDialog(this.matDialog)).subscribe(
      res => {  
        this.configModels = res;
        this.populateMatConfigModel();
      }
    );
  }

  populateMatConfigModel() {
    this.matConfigModels = [];
    this.configModels.forEach(e => {
      this.matConfigModels.push({id: e.id!, name: e.name})
    })
  }

  addSwitch() {
    this.addConfigMapSwitch = !this.addConfigMapSwitch;
    this.detailConfigModel = {id: 0,name: '', file: ''};
  }

  modifySwitch(matRow: MatConfigModel) {
    this.venkinsService.getConfigModel(matRow.id!).pipe(first()).subscribe(
      res => {
        this.detailConfigModel = res;
        this.addConfigMapSwitch = !this.addConfigMapSwitch;
      },  
      error => {
        let dialog = this.matDialog.open(MatDialog, {data: {title: 'Error', message: `Can't modify map with id ${matRow.id} at the moment due to:\n${error}`, ok: 'OK', no: ''}});
        
        dialog.afterClosed().pipe(first()).subscribe(res => { });
      }
    );
  }

  backSwitch() {
    this.init();
    this.addConfigMapSwitch = !this.addConfigMapSwitch;
  }

  addConfigMap() {
    if(this.validForm) {
      this.venkinsService.postConfigModel(this.detailConfigModel).pipe(first()).subscribe(
        res => {
          let dialog = this.matDialog.open(MatDialog, {data: {title: 'Add new config map', message: 'New config map have been added', ok: 'OK', no: ''}});
  
          dialog.afterClosed().pipe(first()).subscribe(
            res => {
              this.init();
              this.addConfigMapSwitch = !this.addConfigMapSwitch;
            }
          );
        },
        error => {
          let dialog = this.matDialog.open(MatDialog, {data: {title: 'Add new config map', message: `Can't add new config map due to:\n${error}`, ok: 'OK', no: ''}});
        
          dialog.afterClosed().pipe(first()).subscribe(res => { });
        }
      );
    }
  }

  modifyConfigMap() {
    if(this.validForm) {
      this.venkinsService.putConfigModel(this.detailConfigModel).pipe(first()).subscribe(
        res => {
          let dialog = this.matDialog.open(MatDialog, {data: {title: 'Modify config map', message: 'Successful modify config mal', ok: 'OK', no: ''}});
  
          dialog.afterClosed().pipe(first()).subscribe(
            res => {
              this.init();
              this.addConfigMapSwitch = !this.addConfigMapSwitch;
            }
          );
        },
        error => {
          let dialog = this.matDialog.open(MatDialog, {data: {title: 'Modify config map', message: `Can't modify config map due to:\n${error}`, ok: 'OK', no: ''}});
        
          dialog.afterClosed().pipe(first()).subscribe(res => { });
        }
      );
    }
  }
}
