import { Component, forwardRef } from '@angular/core';
import { EnsibleItemComponent } from '../ensible-item.component';
import { EnsibleItemService, EnsiblePlaybookItemService } from '../../../service/ensible-item/ensible-item.service';
import { Router } from '@angular/router';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { EnsibleDockerContainerTemplateService } from '../../../service/ensible-docker-container-template/ensible-docker-container-template.service';
import { EnsibleFsService } from '../../../service/ensible-fs/ensible-fs.service';
import { EnsiblePlaybookItem } from '../../../model/ensible.model';

@Component({
  selector: 'app-ensible-item-playbook',
  templateUrl: './ensible-item-playbook.component.html',
  styleUrls: ['./ensible-item-playbook.component.scss'],
  providers: [{ provide: EnsibleItemComponent, useExisting: forwardRef(() => EnsibleItemPlaybookComponent) }]
})
export class EnsibleItemPlaybookComponent extends EnsibleItemComponent<EnsiblePlaybookItem> {

  override blankItem: EnsiblePlaybookItem = new EnsiblePlaybookItem();

  constructor(
    public ensibleItemService: EnsiblePlaybookItemService,
    ensibleFsService: EnsibleFsService,
    rxjsUtils: RxJSUtils,
    dialogUtils: DialogUtils,
    router: Router,
    ensibleDockerContainerTemplateService: EnsibleDockerContainerTemplateService
  ) { 
    super(ensibleFsService, rxjsUtils, dialogUtils, router, ensibleDockerContainerTemplateService);
  }
}
