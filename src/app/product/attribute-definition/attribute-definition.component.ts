import { Component, inject, model, signal, WritableSignal } from '@angular/core';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { AttributeDefinition } from '../../shared/model/product.model';
import { DataUtils } from '../../../lib/util/Data.utils';
import { AttributeDefinitionService } from '../../shared/service/attribute-definition/attribute-definition.service';
import { ViesRestApi } from '../../../lib/abtract/ViesRestApi';
import { RouteUtils } from '../../../lib/util/Route.utils';
import { APP_ROUTES } from '../../app.routes';
import { AttributeOptionComponent } from "../attribute-option/attribute-option.component";
import { AttributeOptionListComponent } from '../attribute-option-list/attribute-option-list.component';

@Component({
  selector: 'app-attribute-definition',
  templateUrl: './attribute-definition.component.html',
  styleUrls: ['./attribute-definition.component.scss'],
  imports: [NgComponentModule, AttributeOptionListComponent]
})
export class AttributeDefinitionComponent extends ViesRestApi<AttributeDefinition, AttributeDefinitionService> {

  service = inject(AttributeDefinitionService);
  validForm = signal<boolean>(false);

  override getRouteId() {
    return RouteUtils.getPathVariableAsInteger(APP_ROUTES.productAttributeDefinition(0).split('/').at(-2)!);
  }
}
