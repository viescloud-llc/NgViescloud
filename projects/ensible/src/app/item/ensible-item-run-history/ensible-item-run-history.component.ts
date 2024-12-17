import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { EnsibleItem, EnsiblePlayBookLogger } from '../../model/ensible.model';
import { EnsiblePlaybookLoggerService } from './../../service/ensible-playbook-logger/ensible-playbook-logger.service';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-ensible-item-run-history',
  templateUrl: './ensible-item-run-history.component.html',
  styleUrls: ['./ensible-item-run-history.component.scss']
})
export class EnsibleItemRunHistoryComponent implements OnInit {

  @Input()
  item!: EnsibleItem;

  logs: EnsiblePlayBookLogger[] = [];

  constructor(
    private ensiblePlaybookLoggerService: EnsiblePlaybookLoggerService,
    private rxjsUtils: RxJSUtils
  ) { }

  ngOnInit(): void {
    this.ensiblePlaybookLoggerService.getAllByItemId(this.item.id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.logs = res;
      }
    });
  }
}
