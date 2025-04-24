import { EnsibleSetting } from './../../model/ensible.setting.model';
import { EnsibleDockerContainerTemplate } from './../../model/ensible.model';
import { EnsibleDockerContainerTemplateService } from './../../service/ensible-docker-container-template/ensible-docker-container-template.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { EnsibleSettingService } from '../../service/ensible-setting/ensible-setting.service';
import { Subject } from 'rxjs';
import { Pageable } from 'projects/viescloud-utils/src/lib/model/Mat.model';
import { RestUtils } from 'projects/viescloud-utils/src/lib/util/Rest.utils';
import { LazyPageChange } from 'projects/viescloud-utils/src/lib/util-component/mat-table-lazy/mat-table-lazy.component';

@Component({
  selector: 'app-ensible-docker-container-template-list',
  templateUrl: './ensible-docker-container-template-list.component.html',
  styleUrls: ['./ensible-docker-container-template-list.component.scss']
})
export class EnsibleDockerContainerTemplateListComponent implements OnInit {

  ensibleDockerContainerTemplatesPage = new Pageable<EnsibleDockerContainerTemplate>();
  blankEnsibleDockerContainerTemplate: EnsibleDockerContainerTemplate = new EnsibleDockerContainerTemplate();
  sendPageIndexChangeSubject = new Subject<void>();

  constructor(
    private router: Router,
    private ensibleDockerContainerTemplateService: EnsibleDockerContainerTemplateService,
    private rxjsUtils: RxJSUtils
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.sendPageIndexChangeSubject.next();
    });
  }

  onLazyPageChange(lazyPageChange: LazyPageChange) {
    this.ensibleDockerContainerTemplateService.getAllPageable(lazyPageChange.pageIndex, lazyPageChange.pageSize, RestUtils.formatSort(lazyPageChange)).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.ensibleDockerContainerTemplatesPage = res;
      }
    });
  }

  addNewTemplate() {
    this.router.navigate(['docker/container/template/0']);
  }

  selectRow(row: EnsibleDockerContainerTemplate) {
    let link = `/docker/container/template/${row.id}`;
    this.router.navigate([link]);
  }
}
