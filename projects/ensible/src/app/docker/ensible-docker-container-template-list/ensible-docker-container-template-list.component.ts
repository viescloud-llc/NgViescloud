import { EnsibleDockerContainerTemplate } from './../../model/ensible.model';
import { EnsibleDockerContainerTemplateService } from './../../service/ensible-docker-container-template/ensible-docker-container-template.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';

@Component({
  selector: 'app-ensible-docker-container-template-list',
  templateUrl: './ensible-docker-container-template-list.component.html',
  styleUrls: ['./ensible-docker-container-template-list.component.scss']
})
export class EnsibleDockerContainerTemplateListComponent implements OnInit {

  ensibleDockerContainerTemplates: EnsibleDockerContainerTemplate[] = [];
  blankEnsibleDockerContainerTemplate: EnsibleDockerContainerTemplate = new EnsibleDockerContainerTemplate();

  constructor(
    private router: Router,
    private ensibleDockerContainerTemplateService: EnsibleDockerContainerTemplateService,
    private rxjsUtils: RxJSUtils
  ) { }

  ngOnInit(): void {
    this.ensibleDockerContainerTemplateService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.ensibleDockerContainerTemplates = res;
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
