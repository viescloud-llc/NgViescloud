import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { EnsibleDockerContainerTemplate } from '../../model/ensible.model';
import { ActivatedRoute, Router } from '@angular/router';
import { EnsibleDockerContainerTemplateService } from '../../service/ensible-docker-container-template/ensible-docker-container-template.service';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { RouteUtils } from 'projects/viescloud-utils/src/lib/util/Route.utils';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/Mat.model';
import { MatDialog } from '@angular/material/dialog';
import { EnsiblePullImageDialog } from '../../dialog/ensible-pull-image-dialog/ensible-pull-image-dialog.component';
import { EnsibleDockerService } from '../../service/ensible-docker/ensible-docker.service';
import { RouteChangeSubcribe } from 'projects/viescloud-utils/src/lib/directive/RouteChangeSubcribe.directive';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';

@Component({
  selector: 'app-ensible-docker-container-template',
  templateUrl: './ensible-docker-container-template.component.html',
  styleUrls: ['./ensible-docker-container-template.component.scss']
})
export class EnsibleDockerContainerTemplateComponent extends RouteChangeSubcribe {

  ensibleDockerContainerTemplate!: EnsibleDockerContainerTemplate;
  ensibleDockerContainerTemplateCopy!: EnsibleDockerContainerTemplate;
  blankEnsibleDockerContainerTemplate: EnsibleDockerContainerTemplate = new EnsibleDockerContainerTemplate();

  validForm = false;
  dockerReady = false;

  constructor(
    private router: Router,
    private ensibleDockerContainerTemplateService: EnsibleDockerContainerTemplateService,
    private ensibleDockerService: EnsibleDockerService,
    private rxjsUtils: RxJSUtils,
    private dialogUtils: DialogUtils,
    route: ActivatedRoute
  ) {
    super(route);
  }

  override async onRouteChange() {
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
    this.dialogUtils.matDialog.open(EnsiblePullImageDialog, {
      data: {
        imageName: this.ensibleDockerContainerTemplate.repository
      },
      width: '100%',
      disableClose: true
    })
  }

  async deleteContainerTemplate() {
    let confirm = await this.dialogUtils.openConfirmDialog("Delete", "Are you sure you want to delete this container template?\nThis cannot be undone", "Yes", "No");

    if(confirm) {
      this.ensibleDockerContainerTemplateService.delete(this.ensibleDockerContainerTemplate.id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
        next: () => {
          let link = `/docker/container/templates`;
          this.router.navigate([link]);
        }
      })
    }
  }
}
