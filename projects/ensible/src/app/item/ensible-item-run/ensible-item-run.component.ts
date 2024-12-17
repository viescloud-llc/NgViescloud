import { EnsiblePlaybookLoggerService } from './../../service/ensible-playbook-logger/ensible-playbook-logger.service';
import { Component, Input, OnInit } from '@angular/core';
import { EnsibleItem, EnsiblePlayBookLogger } from '../../model/ensible.model';
import { RouteUtils } from 'projects/viescloud-utils/src/lib/util/Route.utils';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { NumberUtils } from 'projects/viescloud-utils/src/lib/util/Number.utils';
import { StringUtils } from 'projects/viescloud-utils/src/lib/util/String.utils';

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

  constructor(
    private ensiblePlaybookLoggerService: EnsiblePlaybookLoggerService
  ) { }

  ngOnInit(): void {
    let runNumber = RouteUtils.getQueryParam('runNumber', true);
    if(runNumber) {
      this.runNumber = parseInt(runNumber);
      this.ensiblePlaybookLoggerService.get
    }
  }

  run() {
    RouteUtils.setQueryParam('runNumber', null);
    let uuid = StringUtils.generateUUID();
    RouteUtils.setQueryParam('run', uuid);
    this.isRunning = true;
  }

  stop() {
    RouteUtils.setQueryParam('run', null);
    this.isRunning = false;
  }
}
