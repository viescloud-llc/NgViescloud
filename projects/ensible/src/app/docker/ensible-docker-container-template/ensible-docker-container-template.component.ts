import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { EnsibleDockerContainerTemplate } from '../../model/ensible.model';
import { Router } from '@angular/router';
import { EnsibleDockerContainerTemplateService } from '../../service/ensible-docker-container-template/ensible-docker-container-template.service';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { RouteUtils } from 'projects/viescloud-utils/src/lib/util/Route.utils';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/Mat.model';
import { MatDialog } from '@angular/material/dialog';
import { EnsiblePullImageDialog } from '../../dialog/ensible-pull-image-dialog/ensible-pull-image-dialog.component';
import { EnsibleDockerService } from '../../service/ensible-docker/ensible-docker.service';

const executeWithOptions: MatOption<String>[] = [
  {value: 'bash', valueLabel: 'bash'},
  {value: 'sh', valueLabel: 'sh'},
  {value: 'zsh', valueLabel: 'zsh'},
  {value: 'fish', valueLabel: 'fish'},
  {value: 'ksh', valueLabel: 'ksh'},
  {value: 'tcsh', valueLabel: 'tcsh'},
  {value: 'dash', valueLabel: 'dash'},
  {value: 'ash', valueLabel: 'ash'},
  {value: 'csh', valueLabel: 'csh'},
  {value: 'elm', valueLabel: 'elm'},
  {value: 'mksh', valueLabel: 'mksh'},
  {value: 'elvish', valueLabel: 'elvish'},
  {value: 'PowerShell', valueLabel: 'PowerShell'},
];

@Component({
  selector: 'app-ensible-docker-container-template',
  templateUrl: './ensible-docker-container-template.component.html',
  styleUrls: ['./ensible-docker-container-template.component.scss']
})
export class EnsibleDockerContainerTemplateComponent implements OnInit {

  ensibleDockerContainerTemplate!: EnsibleDockerContainerTemplate;
  ensibleDockerContainerTemplateCopy!: EnsibleDockerContainerTemplate;
  blankEnsibleDockerContainerTemplate: EnsibleDockerContainerTemplate = new EnsibleDockerContainerTemplate();

  executeWithOptions = executeWithOptions;

  validForm = false;
  dockerReady = false;

  constructor(
    private router: Router,
    private ensibleDockerContainerTemplateService: EnsibleDockerContainerTemplateService,
    private ensibleDockerService: EnsibleDockerService,
    private rxjsUtils: RxJSUtils,
    private matDialog: MatDialog,
  ) { 
  }

  async ngOnInit() {
    let id = RouteUtils.getPathVariableAsInteger('template');
    if(!id) {
      this.ensibleDockerContainerTemplate = DataUtils.purgeArray(new EnsibleDockerContainerTemplate());
      this.ensibleDockerContainerTemplateCopy = structuredClone(this.ensibleDockerContainerTemplate);
    }
    else {
      this.ensibleDockerContainerTemplateService.get(id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
        next: res => {
          this.ensibleDockerContainerTemplate = res;
          this.ensibleDockerContainerTemplateCopy = structuredClone(this.ensibleDockerContainerTemplate);
        }
      })
    }

    this.dockerReady = await this.ensibleDockerService.isDockerRunning();
  }

  isValueChange() {
    return DataUtils.isNotEqual(this.ensibleDockerContainerTemplate, this.ensibleDockerContainerTemplateCopy);
  }

  save() {
    if(this.validForm) {
      this.ensibleDockerContainerTemplateService.postOrPut(this.ensibleDockerContainerTemplate.id, this.ensibleDockerContainerTemplate).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
        next: res => {
          if(this.ensibleDockerContainerTemplate.id === 0) {
            let link = `/docker/container/template/${res.id}`;
            this.router.navigate([link]);
          }

          this.ensibleDockerContainerTemplate = res;
          this.ensibleDockerContainerTemplateCopy = structuredClone(this.ensibleDockerContainerTemplate);
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
