import { EnsibleWebsocketService } from './../../service/ensible-websocket/ensible-websocket.service';
import { EnsiblePlaybookLoggerService } from '../../service/ensible-logger/ensible-logger.service';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { EnsiblePlaybookItem, EnsibleItemType, EnsiblePlayBookLogger, EnsiblePlaybookStatus, EnsiblePlayBookTrigger, VERPOSITY_OPTIONS } from '../../model/ensible.model';
import { RouteUtils } from 'projects/viescloud-utils/src/lib/util/Route.utils';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { NumberUtils } from 'projects/viescloud-utils/src/lib/util/Number.utils';
import { StringUtils } from 'projects/viescloud-utils/src/lib/util/String.utils';
import { EnsibleWorkSpace } from '../../model/ensible.parser.model';
import { AnsibleWorkspaceService } from '../../service/ensible-workspace/ensible-workspace.service';
import { SettingService } from 'projects/viescloud-utils/src/lib/service/Setting.service';
import { EnsibleProcessService } from '../../service/ensible-process/ensible-process.service';
import { EnsibleDockerService } from '../../service/ensible-docker/ensible-docker.service';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { delay, timeout } from 'rxjs';

@Component({
  selector: 'app-ensible-item-run',
  templateUrl: './ensible-item-run.component.html',
  styleUrls: ['./ensible-item-run.component.scss']
})
export class EnsibleItemRunComponent implements OnChanges, OnDestroy, OnInit {

  @Input()
  item!: EnsiblePlaybookItem;

  @Input()
  triggerInit: boolean = false;

  logId: number = 0;

  playBookLogger?: EnsiblePlayBookLogger;

  isRunning: boolean = false;

  runOutput: string = '';

  private subscribeTopic?: any = null;
  private onGoingRequest: any[] = [];

  autoScroll: boolean = true;

  verbosityOptions = VERPOSITY_OPTIONS;

  dockerReady = false;

  constructor(
    private ensiblePlaybookLoggerService: EnsiblePlaybookLoggerService,
    private ensibleWebsocketService: EnsibleWebsocketService,
    private ensibleWorkSpaceService: AnsibleWorkspaceService,
    private ensibleProcessService: EnsibleProcessService,
    private ensibleDockerService: EnsibleDockerService,
    private rxjsUtils: RxJSUtils
  ) { }
  ngOnDestroy(): void {
    this.onGoingRequest.forEach(req => {
      req.unsubscribe();
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['triggerInit'] && changes['triggerInit'].previousValue === false) {
      this.ngOnInit();
    }
  }

  async ngOnInit() {
    this.dockerReady = await this.ensibleDockerService.isDockerRunning().catch(err => false);

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
          this.playBookLogger = res;
          if(res.status === EnsiblePlaybookStatus.RUNNING) {
            RouteUtils.setQueryParam('topic', res.topic);
            this.ngOnInit();
          }
          else {
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

  private readyNewTopicOutput() {
    this.cleanParams();
    let uuid = StringUtils.generateUUID();
    RouteUtils.setQueryParam('topic', uuid);
    this.isRunning = true;
    this.runOutput = '';

    return uuid;
  }

  run() {
    let uuid = this.readyNewTopicOutput();

    let playbookTrigger: EnsiblePlayBookTrigger = {
      itemId: this.item.id.toString(),
      outputTopic: uuid,
      consumeEverything: true,
      verbosity: this.item.verbosity
    }

    this.watchTopic(uuid);

    let sub = this.ensibleWorkSpaceService.triggerPlaybook(playbookTrigger).pipe(delay(1000)).subscribe({
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

    this.onGoingRequest.push(sub);
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

    let sub = this.ensibleProcessService.watchProcessByTopic(topic).pipe(delay(1000)).subscribe({
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

    this.onGoingRequest.push(sub);
  }

  stop() {
    let topic = RouteUtils.getDecodedQueryParam('topic');
    this.onGoingRequest.forEach(sub => sub.unsubscribe());

    if(topic) {
      this.ensibleProcessService.stopProcessByTopic(topic).subscribe({
        next: res => {}
      });
    }

    this.cleanParams();
    this.isRunning = false;
    this.subscribeTopic?.unsubscribe();
    this.onGoingRequest.length = 0;
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

  getVerboseLabel() {
    let verbosity = this.item.verbosity;
    return this.verbosityOptions.find(opt => opt.value === verbosity)?.valueLabel ?? 'minimal';
  }

  removeContainer() {
    this.ensibleDockerService.deleteContainerByItemId(EnsibleItemType.ANSIBLE, this.item.id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => { }
    })
  }

  readyContainer() {
    let uuid = this.readyNewTopicOutput();
    this.watchTopic(uuid);
    this.ensibleDockerService.readyContainerByItemId(EnsibleItemType.ANSIBLE, this.item.id, uuid).pipe(delay(1000)).subscribe({
      next: res => {
        this.runOutput = res;
        this.isRunning = false;
        this.cleanParams();
      }
    })
  }
}
