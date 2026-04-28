import { Component, inject, signal } from '@angular/core';
import { DialogUtils } from '../../../lib/util/Dialog.utils';
import { RxJSUtils } from '../../../lib/util/RxJS.utils';
import { AttributeOptionService } from '../../shared/service/attribute-option/attribute-option.service';
import { AttributeOption } from '../../shared/model/product.model';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { APP_ROUTES } from '../../app.routes';
import { Router } from '@angular/router';

@Component({
  selector: 'app-attribute-option-list',
  templateUrl: './attribute-option-list.component.html',
  styleUrls: ['./attribute-option-list.component.scss'],
  imports: [NgComponentModule]
})
export class AttributeOptionListComponent {

  readonly attributeOptionService = inject(AttributeOptionService);
  readonly rxjsUtils = inject(RxJSUtils);
  readonly dialogUtils = inject(DialogUtils);
  readonly router = inject(Router);

  attributeOptionList = signal<AttributeOption[]>([]);
  blankAttributeOption = new AttributeOption();
  selectedAttributeOption = signal<AttributeOption | null>(null);

  addAttributeOption() {
    this.router.navigate([APP_ROUTES.productAttributeOption(0)]);
  }
}
