import { EnsibleWebsocketService } from './../../service/ensible-websocket/ensible-websocket.service';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { EnsibleItem, EnsibleItemTrigger, EnsibleItemTypeEnum, EnsiblePlaybookItem, EnsiblePlaybookLogger, EnsiblePlaybookStatus, EnsiblePlayBookTrigger, EnsibleShellItem, EnsibleShellTrigger, VERPOSITY_OPTIONS } from '../../model/ensible.model';
import { RouteUtils } from 'projects/viescloud-utils/src/lib/util/Route.utils';
import { StringUtils } from 'projects/viescloud-utils/src/lib/util/String.utils';
import { EnsibleProcessService } from '../../service/ensible-process/ensible-process.service';
import { EnsibleDockerService } from '../../service/ensible-docker/ensible-docker.service';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { delay } from 'rxjs';
import { EnsibleItemLoggerServiceType, EnsibleItemloggerType, EnsibleItemType, EnsibleWorkspaceServiceType } from '../ensible-item-tab/ensible-item-tab.component';

@Component({
  selector: 'app-ensible-item-run',
  templateUrl: './ensible-item-run.component.html',
  styleUrls: ['./ensible-item-run.component.scss']
})
export class EnsibleItemRunComponent implements OnChanges, OnDestroy, OnInit {

  @Input()
  item!: EnsibleItemType;

  @Input()
  itemLoggerService!: EnsibleItemLoggerServiceType;

  @Input()
  itemWorkspaceService!: EnsibleWorkspaceServiceType;

  @Input()
  triggerInit: boolean = false;

  logId: number = 0;

  playBookLogger?: EnsibleItemloggerType;

  isRunning: boolean = false;

  runOutput: string = '';

  private subscribeTopic?: any = null;
  private onGoingRequest: any[] = [];

  autoScroll: boolean = true;

  verbosityOptions = VERPOSITY_OPTIONS;

  dockerReady = false;

  constructor(
    private ensibleWebsocketService: EnsibleWebsocketService,
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
      this.itemLoggerService.get(this.logId).subscribe({
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
    if(this.item instanceof EnsiblePlaybookItem) {
      this.runItem(this.item as EnsiblePlaybookItem, (i, uuid) => {
        return {
          itemId: i.id.toString(),
          outputTopic: uuid,
          consumeEverything: true,
          verbosity: i.verbosity
        }
      });
    }
    else if(this.item instanceof EnsibleShellItem) {
      this.runItem(this.item as EnsibleShellItem, (i, uuid) => {
        return {
          itemId: i.id.toString(),
          outputTopic: uuid,
          consumeEverything: true
        }
      });
    }
  }

  runItem<T extends EnsibleItem>(item: T, func: (i: T, uuid: string) => EnsibleItemTrigger): void {
    let uuid = this.readyNewTopicOutput();

    let itemTrigger = func(item, uuid);

    this.watchTopic(uuid);

    let sub = this.itemWorkspaceService.runCommand(itemTrigger).pipe(delay(1000)).subscribe({
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
    let verbosity = VERPOSITY_OPTIONS[0].value;

    if(this.item instanceof EnsiblePlaybookItem) {
      verbosity = (this.item as EnsiblePlaybookItem).verbosity;
    }
    else if(this.item instanceof EnsibleShellItem) {
      //TODO add verbose for shell script maybe
    }

    return this.verbosityOptions.find(opt => opt.value === verbosity)?.valueLabel ?? 'minimal';
  }

  removeContainer() {
    let type: EnsibleItemTypeEnum | null = null;
    if(this.item instanceof EnsiblePlaybookItem) {
      type = EnsibleItemTypeEnum.ANSIBLE;
    }
    else if(this.item instanceof EnsibleShellItem) {
      type = EnsibleItemTypeEnum.SHELL;
    }
    else {
      return;
    }

    this.ensibleDockerService.deleteContainerByItemId(type, this.item.id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => { }
    })
  }

  readyContainer() {
    let uuid = this.readyNewTopicOutput();
    this.watchTopic(uuid);

    let type: EnsibleItemTypeEnum | null = null;
    if(this.item instanceof EnsiblePlaybookItem) {
      type = EnsibleItemTypeEnum.ANSIBLE;
    }
    else if(this.item instanceof EnsibleShellItem) {
      type = EnsibleItemTypeEnum.SHELL;
    }
    else {
      return;
    }
    
    this.ensibleDockerService.readyContainerByItemId(type, this.item.id, uuid).pipe(delay(1000)).subscribe({
      next: res => {
        this.runOutput = res;
        this.isRunning = false;
        this.cleanParams();
      }
    })
  }
}
