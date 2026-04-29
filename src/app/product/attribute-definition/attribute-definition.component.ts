import { Component, inject, model, signal, WritableSignal } from '@angular/core';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { AttributeDefinition } from '../../shared/model/product.model';
import { DataUtils } from '../../../lib/util/Data.utils';
import { AttributeDefinitionService } from '../../shared/service/attribute-definition/attribute-definition.service';
import { ViesRestApi } from '../../../lib/abtract/ViesRestApi';
import { RouteUtils } from '../../../lib/util/Route.utils';
import { APP_ROUTES } from '../../app.routes';

@Component({
  selector: 'app-attribute-definition',
  templateUrl: './attribute-definition.component.html',
  styleUrls: ['./attribute-definition.component.scss'],
  imports: [NgComponentModule]
})
export class AttributeDefinitionComponent extends ViesRestApi<AttributeDefinition, AttributeDefinitionService> {

  service = inject(AttributeDefinitionService);
  validForm = signal<boolean>(false);

  // override get service(): AttributeDefinitionService {
  //   return inject(AttributeDefinitionService);
  // }

  // override getValue(): WritableSignal<AttributeDefinition> {
  //   return this.attributeDefinition;
  // }

  override getRouteId() {
    return RouteUtils.getPathVariableAsInteger(APP_ROUTES.productAttributeDefinition(0).split('/').at(-2)!);
  }

  delete() {

  }
}
