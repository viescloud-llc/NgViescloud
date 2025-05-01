import { EnsibleWebsocketService } from './../../service/ensible-websocket/ensible-websocket.service';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { EnsibleItem, EnsibleItemTrigger, EnsibleItemTypeEnum, EnsiblePlaybookItem, EnsiblePlaybookLogger, EnsibleProcessLoggerStatus, EnsiblePlayBookTrigger, EnsibleShellItem, EnsibleShellTrigger, VERPOSITY_OPTIONS } from '../../model/ensible.model';
import { RouteUtils } from 'projects/viescloud-utils/src/lib/util/Route.utils';
import { StringUtils } from 'projects/viescloud-utils/src/lib/util/String.utils';
import { EnsibleProcessService } from '../../service/ensible-process/ensible-process.service';
import { EnsibleDockerService } from '../../service/ensible-docker/ensible-docker.service';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { catchError, delay, retry, retryWhen, scan, throwError, timer } from 'rxjs';
import { EnsibleItemLoggerServiceType, EnsibleItemloggerType, EnsibleItemTabComponent, EnsibleItemType, EnsibleWorkspaceServiceType } from '../ensible-item-tab/ensible-item-tab.component';
import { EnsibleAnsibleWorkspaceService, EnsibleShellWorkspaceService } from '../../service/ensible-workspace/ensible-workspace.service';
import { HttpErrorResponse } from '@angular/common/http';

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

  itemLogger?: EnsibleItemloggerType;

  isRunning: boolean = false;

  runOutput: string = '';

  private subscribeTopic?: any = null;
  private onGoingRequest: any[] = [];

  autoScroll: boolean = true;

  verbosityOptions = VERPOSITY_OPTIONS;

  dockerReady = false;

  EnsibleItemTypeEnum = EnsibleItemTypeEnum;
  type = EnsibleItemTypeEnum.UNKNOWN;

  waitMs = 10000;

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
    this.type = EnsibleItemTabComponent.fromService(this.itemWorkspaceService);
    this.dockerReady = await this.ensibleDockerService.isDockerRunning().catch(err => false);
    
    if(!this.ensibleWebsocketService.isConnected()) {
      this.ensibleWebsocketService.connect();
    }

    let logId = RouteUtils.getDecodedQueryParam('logId');
    let topic = RouteUtils.getDecodedQueryParam('topic');

    if(topic) {
      this.runOutput = 'Reconnecting...';
      this.watchTopicWs(topic);
      this.waitRun(topic);
    }
    else if(logId) {
      this.logId = parseInt(logId);
      this.subscribeTopic?.unsubscribe();
      this.fetchLog(this.logId, err => {
        this.runOutput = 'Unable to fetch logs, please reload or select another log from history tab';
      });
      
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
    if(this.type === EnsibleItemTypeEnum.ANSIBLE) {
      this.runItem(this.item as EnsiblePlaybookItem, (i, uuid) => {
        return {
          itemId: i.id.toString(),
          outputTopic: uuid,
          consumeEverything: true,
          verbosity: i.verbosity
        }
      });
    }
    else if(this.type === EnsibleItemTypeEnum.SHELL) {
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

    this.watchTopicWs(uuid);

    let sub = this.itemWorkspaceService.runCommandAndGetLog(itemTrigger).subscribe({
      next: res => {
        this.itemLogger = res;
        this.waitRun(uuid);
      },
      error: err => {
        this.isRunning = false;
        this.cleanParams();
      }
    });

    this.onGoingRequest.push(sub);
  }

  watchTopicWs(topic: string) {
    this.subscribeTopic?.unsubscribe();
    this.subscribeTopic = this.ensibleWebsocketService.watchForEnsibleTopic(topic).subscribe({
      next: res => {
        this.runOutput = res.body;
      }
    });
  }

  waitRun(topic: string) {
    this.isRunning = true;

    let sub = this.ensibleProcessService.watchProcessByTopic(topic, this.waitMs).pipe(
      retry({
        count: 1000,
        delay: (err, retryCount) => {
          switch (err.status) {
            case 408:
              return timer(this.waitMs);
            default:
              return throwError(() => err);
          }
        },
      }))
      .subscribe({
      next: res => {
        this.runOutput = res;
        this.isRunning = false;
        if(this.itemLogger && this.itemLogger.id) {
          this.fetchLog(this.itemLogger.id);
        }

        this.cleanParams();
      },
      error: err => {
        this.isRunning = false;

        if(this.itemLogger && this.itemLogger.id) {
          this.fetchLog(this.itemLogger.id, err => {
            this.runOutput = 'Unable to reconnect, process might have been stopped or finished, check latest run history for more details';
          });
        }
        else {
          this.runOutput = 'Unable to reconnect, process might have been stopped or finished, check latest run history for more details';
        }

        this.cleanParams();
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
  }

  clean() {
    this.cleanParams();
    this.runOutput = '';
    this.itemLogger = undefined;
    this.ngOnInit();
  }

  getVerboseLabel() {
    let verbosity = VERPOSITY_OPTIONS[0].value;

    if(this.type === EnsibleItemTypeEnum.ANSIBLE) {
      verbosity = (this.item as EnsiblePlaybookItem).verbosity;
    }
    else if(this.type === EnsibleItemTypeEnum.SHELL) {
      //TODO add verbose for shell script maybe
      verbosity = 'minimal';
    }

    return this.verbosityOptions.find(opt => opt.value === verbosity)?.valueLabel ?? 'minimal';
  }

  removeContainer() {
    this.ensibleDockerService.deleteContainerByItemId(this.type, this.item.id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => { }
    })
  }

  readyContainer() {
    let uuid = this.readyNewTopicOutput();
    this.watchTopicWs(uuid);
    
    this.ensibleDockerService.readyContainerByItemId(this.type, this.item.id, uuid).subscribe({
      next: res => {
        this.runOutput = res;
        this.isRunning = false;
        this.cleanParams();
      }
    })
  }

  private fetchLog(logId: number, errorHandler?: (error: any) => void) {
    this.itemLoggerService.get(logId).subscribe({
      next: res => {
        this.itemLogger = res;
        if(res.status === EnsibleProcessLoggerStatus.RUNNING) {
          RouteUtils.setQueryParam('topic', res.topic);
          this.ngOnInit();
        }
        else {
          this.runOutput = res.log;
        }
      },
      error: err => {
        if(errorHandler) {
          errorHandler(err);
        }
      }
    });
  }
}
