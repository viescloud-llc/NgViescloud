import { Component, inject, OnInit, signal } from '@angular/core';
import { AttributeDefinition } from '../../../shared/model/attribute.model';
import { NgComponentModule } from "../../../../lib/module/ng-component.module";
import { AttributeDefinitionService } from '../../../shared/service/attribute-definition/attribute-definition.service';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { Router } from '@angular/router';
import { APP_ROUTES } from '../../../app.routes';

@Component({
  selector: 'app-attribute-definition-list',
  templateUrl: './attribute-definition-list.component.html',
  styleUrls: ['./attribute-definition-list.component.scss'],
  imports: [NgComponentModule]
})
export class AttributeDefinitionListComponent extends ViesMatFormFieldMap implements OnInit {

  readonly attributeDefinitionService = inject(AttributeDefinitionService);
  readonly rxjsUtils = inject(RxJSUtils);
  readonly dialogUtils = inject(DialogUtils);
  readonly router = inject(Router);

  attributeDefinitionList = signal<AttributeDefinition[]>([]);
  blankAttributeDefinition = new AttributeDefinition();

  ngOnInit(): void {
    this.attributeDefinitionService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.attributeDefinitionList.set([...res]);
      },
      error: err => {
        this.dialogUtils.openErrorMessageFromError(err);
      }
    })
  }

  selectAttributeDefinition(attributeDefinition: AttributeDefinition) {
    this.router.navigate([APP_ROUTES.schemaAttributeDefinition(attributeDefinition.id)]);
  }

  addAttributeDefinition() {
    this.router.navigate([APP_ROUTES.schemaAttributeDefinition('')]);
  }
}
