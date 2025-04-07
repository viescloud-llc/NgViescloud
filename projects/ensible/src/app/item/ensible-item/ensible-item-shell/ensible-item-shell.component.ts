import { Component, forwardRef } from '@angular/core';
import { EnsibleItemComponent } from '../ensible-item.component';
import { Router } from '@angular/router';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { EnsibleDockerContainerTemplateService } from '../../../service/ensible-docker-container-template/ensible-docker-container-template.service';
import { EnsibleFsService } from '../../../service/ensible-fs/ensible-fs.service';
import { EnsibleShellItem } from '../../../model/ensible.model';
import { EnsibleItemService, EnsibleShellItemService } from '../../../service/ensible-item/ensible-item.service';

@Component({
  selector: 'app-ensible-item-shell',
  templateUrl: './ensible-item-shell.component.html',
  styleUrls: ['./ensible-item-shell.component.scss'],
  providers: [{ provide: EnsibleItemComponent, useExisting: forwardRef(() => EnsibleItemShellComponent) }]
})
export class EnsibleItemShellComponent extends EnsibleItemComponent<EnsibleShellItem> {

  blankItem: EnsibleShellItem = new EnsibleShellItem();

  constructor(
    ensibleItemService: EnsibleShellItemService,
    ensibleFsService: EnsibleFsService,
    rxjsUtils: RxJSUtils,
    dialogUtils: DialogUtils,
    router: Router,
    ensibleDockerContainerTemplateService: EnsibleDockerContainerTemplateService
  ) { 
    super(ensibleItemService, ensibleFsService, rxjsUtils, dialogUtils, router, ensibleDockerContainerTemplateService);
  }

  override getSuffix(): string {
    return 'shells';
  }
}
