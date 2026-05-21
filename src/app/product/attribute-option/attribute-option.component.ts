import { Component, computed, inject, model, OnInit, signal } from '@angular/core';
import { NgComponentModule } from "../../../lib/module/ng-component.module";
import { AttributeOption } from '../../shared/model/product.model';
import { DataUtils } from '../../../lib/util/Data.utils';
import { ValueTracking } from '../../../lib/abtract/valueTracking.directive';
import { ViesMatFormFieldMap } from '../../../lib/abtract/ViesMatFormFieldMap';
import { AttributeOptionService } from '../../shared/service/attribute-option/attribute-option.service';
import { RxJSUtils } from '../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../lib/util/Dialog.utils';
import { RouteUtils } from '../../../lib/util/Route.utils';
import { ViesRestApi } from '../../../lib/abtract/ViesRestApi';
import { APP_ROUTES } from '../../app.routes';

@Component({
  selector: 'app-attribute-option',
  templateUrl: './attribute-option.component.html',
  styleUrls: ['./attribute-option.component.scss'],
  imports: [NgComponentModule]
})
export class AttributeOptionComponent extends ViesRestApi<AttributeOption, AttributeOptionService> implements OnInit {

  service: AttributeOptionService = inject(AttributeOptionService);
  validForm = signal<boolean>(false);

  override getRouteId(): string | number | null | undefined {
    return RouteUtils.getPathVariableAsInteger(APP_ROUTES.productAttributeOption(0).split('/').at(-2)!);
  }

}
