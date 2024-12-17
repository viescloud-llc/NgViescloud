import { EnsibleWebsocketService } from './../../service/ensible-websocket/ensible-websocket.service';
import { EnsiblePlaybookLoggerService } from './../../service/ensible-playbook-logger/ensible-playbook-logger.service';
import { Component, Input, OnInit } from '@angular/core';
import { EnsibleItem, EnsiblePlayBookLogger, EnsiblePlayBookTrigger } from '../../model/ensible.model';
import { RouteUtils } from 'projects/viescloud-utils/src/lib/util/Route.utils';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { NumberUtils } from 'projects/viescloud-utils/src/lib/util/Number.utils';
import { StringUtils } from 'projects/viescloud-utils/src/lib/util/String.utils';
import { EnsibleWorkSpace } from '../../model/ensible.parser.model';
import { EnsibleWorkspaceService } from '../../service/ensible-workspace/ensible-workspace.service';
import { SettingService } from 'projects/viescloud-utils/src/lib/service/Setting.service';

@Component({
  selector: 'app-ensible-item-run',
  templateUrl: './ensible-item-run.component.html',
  styleUrls: ['./ensible-item-run.component.scss']
})
export class EnsibleItemRunComponent implements OnInit {

  @Input()
  item!: EnsibleItem;

  runNumber: number = 0;

  playBookLogger?: EnsiblePlayBookLogger;

  isRunning: boolean = false;

  runOutput: string = '';

  private subscribeTopic?: any = null;

  autoScroll: boolean = true;

  constructor(
    private ensiblePlaybookLoggerService: EnsiblePlaybookLoggerService,
    private ensibleWebsocketService: EnsibleWebsocketService,
    private ensibleWorkSpaceService: EnsibleWorkspaceService,
    private settingService: SettingService
  ) { }

  ngOnInit(): void {
    let runNumber = RouteUtils.getQueryParam('runNumber', true);
    if(runNumber) {
      this.runNumber = parseInt(runNumber);
      this.ensiblePlaybookLoggerService.getByItemIdAndRunNumber(this.item.id, this.runNumber).subscribe({
        next: res => {
          this.playBookLogger = res;
          this.runOutput = res.log;
        }
      })
    }

    if(!this.ensibleWebsocketService.isConnected()) {
      this.ensibleWebsocketService.connect();
    }
  }

  run() {
    RouteUtils.setQueryParam('runNumber', null);
    let uuid = StringUtils.generateUUID();
    RouteUtils.setQueryParam('run', uuid);
    this.isRunning = true;
    this.runOutput = '';

    let playbookTrigger: EnsiblePlayBookTrigger = {
      itemId: this.item.id.toString(),
      outputTopic: uuid,
      consumeEverything: true
    }

    this.subscribeTopic?.unsubscribe();
    this.subscribeTopic = this.ensibleWebsocketService.watchForEnsibleTopic(uuid).subscribe({
      next: res => {
        this.runOutput = res.body;
      }
    });

    this.ensibleWorkSpaceService.triggerPlaybook(playbookTrigger).subscribe({
      next: res => {
        this.runOutput = res;
        this.isRunning = false;
      },
      error: err => {
        this.isRunning = false;
      }
    });
  }

  stop() {
    RouteUtils.setQueryParam('run', null);
    this.isRunning = false;
    this.subscribeTopic?.unsubscribe();
    //TODO: accually stop from the server
  }
}
