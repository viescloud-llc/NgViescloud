import { Component, OnInit } from '@angular/core';
import { EnsibleDockerContainerTemplate } from '../../model/ensible.model';
import { Router } from '@angular/router';
import { EnsibleDockerContainerTemplateService } from '../../service/ensible-docker-container-template/ensible-docker-container-template.service';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { RouteUtils } from 'projects/viescloud-utils/src/lib/util/Route.utils';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/Mat.model';
import { MatDialog } from '@angular/material/dialog';
import { EnsiblePullImageDialog } from '../../dialog/ensible-pull-image-dialog/ensible-pull-image-dialog.component';

@Component({
  selector: 'app-ensible-docker-container-template',
  templateUrl: './ensible-docker-container-template.component.html',
  styleUrls: ['./ensible-docker-container-template.component.scss']
})
export class EnsibleDockerContainerTemplateComponent implements OnInit {

  ensibleDockerContainerTemplate!: EnsibleDockerContainerTemplate;
  ensibleDockerContainerTemplateCopy!: EnsibleDockerContainerTemplate;
  blankEnsibleDockerContainerTemplate: EnsibleDockerContainerTemplate = new EnsibleDockerContainerTemplate();

  executeWithOptions: MatOption<String>[] = [
    {
      value: 'bash',
      valueLabel: 'bash'
    },
    {
      value: 'sh',
      valueLabel: 'sh'
    }
  ]

  validForm = false;

  constructor(
    private router: Router,
    private ensibleDockerContainerTemplateService: EnsibleDockerContainerTemplateService,
    private rxjsUtils: RxJSUtils,
    private matDialog: MatDialog
  ) { }

  ngOnInit(): void {
    let id = RouteUtils.getPathVariableAsInteger('template');
    if(!id) {
      this.ensibleDockerContainerTemplate = DataUtils.purgeArray(new EnsibleDockerContainerTemplate());
      this.ensibleDockerContainerTemplate.environmentVariables = {};
      this.ensibleDockerContainerTemplateCopy = structuredClone(this.ensibleDockerContainerTemplate);
    }
    else {
      this.ensibleDockerContainerTemplateService.get(id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
        next: res => {
          this.ensibleDockerContainerTemplate = res;
          this.ensibleDockerContainerTemplate.environmentVariables = {};
          this.ensibleDockerContainerTemplate.extraParameters = this.ensibleDockerContainerTemplate.extraParameters || [];
          this.ensibleDockerContainerTemplate.postArguments = this.ensibleDockerContainerTemplate.postArguments || [];
          this.ensibleDockerContainerTemplateCopy = structuredClone(this.ensibleDockerContainerTemplate);
        }
      })
    }
  }

  isValueChange() {
    return DataUtils.isNotEqualWith(this.ensibleDockerContainerTemplate, this.ensibleDockerContainerTemplateCopy, this.blankEnsibleDockerContainerTemplate);
  }

  save() {
    if(this.validForm) {
      this.ensibleDockerContainerTemplateService.postOrPut(this.ensibleDockerContainerTemplate.id, this.ensibleDockerContainerTemplate).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
        next: res => {
          if(this.ensibleDockerContainerTemplate.id === 0) {
            let link = `/docker/container/template/${res.id}`;
            this.router.navigate([link]);
            this.ngOnInit();
          }
          else {
            this.ensibleDockerContainerTemplate = res;
            this.ensibleDockerContainerTemplateCopy = structuredClone(this.ensibleDockerContainerTemplate);
          }
        }
      })
    }
  }

  revert() {
    this.ensibleDockerContainerTemplate = structuredClone(this.ensibleDockerContainerTemplateCopy);
  }

  pullImage() {
    let dialog = this.matDialog.open(EnsiblePullImageDialog, {
      data: {
        imageName: this.ensibleDockerContainerTemplate.repository
      },
      width: '100%',
      disableClose: true
    })
  }
}
