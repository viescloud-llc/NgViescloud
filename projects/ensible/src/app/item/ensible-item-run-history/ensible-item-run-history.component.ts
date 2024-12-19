import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { EnsibleItem, EnsiblePlayBookLogger } from '../../model/ensible.model';
import { EnsiblePlaybookLoggerService } from './../../service/ensible-playbook-logger/ensible-playbook-logger.service';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { RouteUtils } from 'projects/viescloud-utils/src/lib/util/Route.utils';

@Component({
  selector: 'app-ensible-item-run-history',
  templateUrl: './ensible-item-run-history.component.html',
  styleUrls: ['./ensible-item-run-history.component.scss']
})
export class EnsibleItemRunHistoryComponent implements OnChanges {

  @Input()
  item!: EnsibleItem;

  @Input()
  triggerInit: boolean = false;

  logs: EnsiblePlayBookLogger[] = [];
  blankLog: EnsiblePlayBookLogger = new EnsiblePlayBookLogger();

  @Output()
  onSelectedLog: EventEmitter<EnsiblePlayBookLogger> = new EventEmitter<EnsiblePlayBookLogger>();

  constructor(
    private ensiblePlaybookLoggerService: EnsiblePlaybookLoggerService,
    private rxjsUtils: RxJSUtils
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['triggerInit'] && changes['triggerInit'].previousValue === false) {
      this.ngOnInit();
    }
  }

  ngOnInit(): void {
    this.ensiblePlaybookLoggerService.getAllByItemId(this.item.id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.logs = res;
      }
    });
  }

  selectLog(log: EnsiblePlayBookLogger) {
    RouteUtils.setQueryParam('logId', log.id.toString());
    this.onSelectedLog.emit(log);
  }
}
