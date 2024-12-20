import { EnsibleWebsocketService } from './../../service/ensible-websocket/ensible-websocket.service';
import { EnsiblePlaybookLoggerService } from './../../service/ensible-playbook-logger/ensible-playbook-logger.service';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { EnsibleItem, EnsiblePlayBookLogger, EnsiblePlaybookStatus, EnsiblePlayBookTrigger } from '../../model/ensible.model';
import { RouteUtils } from 'projects/viescloud-utils/src/lib/util/Route.utils';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { NumberUtils } from 'projects/viescloud-utils/src/lib/util/Number.utils';
import { StringUtils } from 'projects/viescloud-utils/src/lib/util/String.utils';
import { EnsibleWorkSpace } from '../../model/ensible.parser.model';
import { EnsibleWorkspaceService } from '../../service/ensible-workspace/ensible-workspace.service';
import { SettingService } from 'projects/viescloud-utils/src/lib/service/Setting.service';
import { EnsibleProcessService } from '../../service/ensible-process/ensible-process.service';

@Component({
  selector: 'app-ensible-item-run',
  templateUrl: './ensible-item-run.component.html',
  styleUrls: ['./ensible-item-run.component.scss']
})
export class EnsibleItemRunComponent implements OnChanges {

  @Input()
  item!: EnsibleItem;

  @Input()
  triggerInit: boolean = false;

  logId: number = 0;

  playBookLogger?: EnsiblePlayBookLogger;

  isRunning: boolean = false;

  runOutput: string = '';

  private subscribeTopic?: any = null;

  autoScroll: boolean = true;

  constructor(
    private ensiblePlaybookLoggerService: EnsiblePlaybookLoggerService,
    private ensibleWebsocketService: EnsibleWebsocketService,
    private ensibleWorkSpaceService: EnsibleWorkspaceService,
    private ensibleProcessService: EnsibleProcessService,
    private settingService: SettingService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['triggerInit'] && changes['triggerInit'].previousValue === false) {
      this.ngOnInit();
    }
  }

  ngOnInit(): void {
    if(!this.ensibleWebsocketService.isConnected()) {
      this.ensibleWebsocketService.connect();
    }

    let logId = RouteUtils.getDecodedQueryParam('logId');
    let topic = RouteUtils.getDecodedQueryParam('topic');

    if(topic) {
      this.runOutput = 'Reconnecting...';
      this.watchTopic(topic);
      this.continuteRun(topic);
    }
    else if(logId) {
      this.logId = parseInt(logId);
      this.ensiblePlaybookLoggerService.get(this.logId).subscribe({
        next: res => {
          if(res.status === EnsiblePlaybookStatus.RUNNING) {
            RouteUtils.setQueryParam('topic', res.topic);
            this.ngOnInit();
          }
          else {
            this.playBookLogger = res;
            this.runOutput = res.log;
          }
        },
        error: err => {
          this.runOutput = 'Unable to fetch logs, please reload or select another log from history tab';
        }
      })
    }
    else {
      this.logId = 0;
    }
  }

  run() {
    this.cleanParams();
    let uuid = StringUtils.generateUUID();
    RouteUtils.setQueryParam('topic', uuid);
    this.isRunning = true;
    this.runOutput = '';

    let playbookTrigger: EnsiblePlayBookTrigger = {
      itemId: this.item.id.toString(),
      outputTopic: uuid,
      consumeEverything: true
    }

    this.watchTopic(uuid);

    this.ensibleWorkSpaceService.triggerPlaybook(playbookTrigger).subscribe({
      next: res => {
        this.runOutput = res;
        this.isRunning = false;
        this.cleanParams();
      },
      error: err => {
        this.isRunning = false;
        this.cleanParams();
      }
    });
  }

  watchTopic(topic: string) {
    this.subscribeTopic?.unsubscribe();
    this.subscribeTopic = this.ensibleWebsocketService.watchForEnsibleTopic(topic).subscribe({
      next: res => {
        this.runOutput = res.body;
      }
    });
  }

  continuteRun(topic: string) {
    this.isRunning = true;

    this.ensibleProcessService.watchProcessByTopic(topic).subscribe({
      next: res => {
        this.runOutput = res;
        this.isRunning = false;
        this.cleanParams();
      },
      error: err => {
        this.isRunning = false;
        this.cleanParams();
        this.runOutput = 'Unable to reconnect, process might have been stopped or finished, check latest run history for more details';
      }
    })
  }

  stop() {
    let topic = RouteUtils.getDecodedQueryParam('topic');
    if(topic) {
      this.ensibleProcessService.stopProcessByTopic(topic).subscribe({
        next: res => {}
      });
    }

    this.cleanParams();
    this.isRunning = false;
    this.subscribeTopic?.unsubscribe();
  }

  cleanParams() {
    RouteUtils.setQueryParam('topic', null);
    RouteUtils.setQueryParam('logId', null);
    this.logId = 0;
    this.playBookLogger = undefined;
  }

  clean() {
    this.cleanParams();
    this.runOutput = '';
    this.ngOnInit();
  }
}
