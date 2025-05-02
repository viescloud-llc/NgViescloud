import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { EnsiblePlaybookItem, EnsiblePlaybookLogger, EnsibleProcessLoggerStatus, EnsibleShellLogger } from '../../model/ensible.model';
import { EnsiblePlaybookLoggerService, EnsibleShellLoggerService } from '../../service/ensible-logger/ensible-logger.service';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { RouteUtils } from 'projects/viescloud-utils/src/lib/util/Route.utils';
import { EnsibleItemLoggerServiceType, EnsibleItemloggerType, EnsibleItemType } from '../ensible-item-tab/ensible-item-tab.component';
import { Pageable } from 'projects/viescloud-utils/src/lib/model/Mat.model';
import { RestUtils } from 'projects/viescloud-utils/src/lib/util/Rest.utils';
import { LazyPageChange } from 'projects/viescloud-utils/src/lib/util-component/mat-table-lazy/mat-table-lazy.component';
import { Subject } from 'rxjs';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { EnsibleProcessService } from '../../service/ensible-process/ensible-process.service';

@Component({
  selector: 'app-ensible-item-run-history',
  templateUrl: './ensible-item-run-history.component.html',
  styleUrls: ['./ensible-item-run-history.component.scss']
})
export class EnsibleItemRunHistoryComponent implements OnChanges {

  @Input()
  item!: EnsibleItemType;

  @Input()
  itemLoggerService!: EnsibleItemLoggerServiceType;

  @Input()
  triggerInit: boolean = false;

  @Output()
  onSelectedLog: EventEmitter<EnsibleItemloggerType> = new EventEmitter<EnsibleItemloggerType>();

  pageLogs!: Pageable<EnsibleItemloggerType>;
  blankLog!: EnsibleItemloggerType;
  sendPageIndexChangeSubject = new Subject<void>();

  constructor(
    private rxjsUtils: RxJSUtils,
    private dialogUtils: DialogUtils,
    private ensibleProcessService: EnsibleProcessService,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['triggerInit'] && changes['triggerInit'].previousValue === false) {
      this.ngOnInit();
    }
  }

  ngOnInit(): void {
    if(this.triggerInit) {
      this.blankLog = this.itemLoggerService.newEmptyObject();
      this.sendPageIndexChangeSubject.next();
    }
  }

  onLazyPageChange(lazyPageChange: LazyPageChange) {
    this.itemLoggerService.getAllByItemIdOptimizePage(this.item.id, lazyPageChange.pageIndex, lazyPageChange.pageSize, RestUtils.formatSort(lazyPageChange)).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.pageLogs = res;
      }
    });
  }

  selectLog(log: EnsibleItemloggerType) {
    RouteUtils.setQueryParam('logId', log.id.toString());
    RouteUtils.setQueryParam('topic', null);
    this.onSelectedLog.emit(log);
  }

  selectLogInNewTab(log: EnsibleItemloggerType) {
    RouteUtils.setQueryParam('logId', log.id.toString());
    RouteUtils.setQueryParam('topic', null);
    RouteUtils.setQueryParam('tab', 'Runs');
    window.open(window.location.href, '_blank');
  }

  isRunning(log: EnsibleItemloggerType) {
    return log.status === EnsibleProcessLoggerStatus.RUNNING || log.status === EnsibleProcessLoggerStatus.START;
  }

  removeLog(log: EnsibleItemloggerType) {
    if(log.id) {
      this.itemLoggerService.delete(log.id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
        next: () => {
          this.sendPageIndexChangeSubject.next();
        },
        error: err => {
          this.dialogUtils.openErrorMessageFromError(err);
        }
      });
    }
  }

  stop(log: EnsibleItemloggerType) {
    let topic = log.topic;

    if(topic) {
      this.ensibleProcessService.stopProcessByTopic(topic).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
        next: res => {
          this.sendPageIndexChangeSubject.next();
        },
        error: err => {
          this.dialogUtils.openErrorMessageFromError(err);
        }
      });
    }
  }
}
