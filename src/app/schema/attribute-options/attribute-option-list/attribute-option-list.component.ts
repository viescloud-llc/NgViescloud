import { Component, inject, OnInit, signal } from '@angular/core';
import { DialogUtils } from '../../../../lib/util/Dialog.utils';
import { RxJSUtils } from '../../../../lib/util/RxJS.utils';
import { AttributeOptionService } from '../../../shared/service/attribute-option/attribute-option.service';
import { AttributeOption } from '../../../shared/model/attribute.model';
import { NgComponentModule } from '../../../../lib/module/ng-component.module';
import { APP_ROUTES } from '../../../app.routes';
import { Router } from '@angular/router';
import { ViesMatFormFieldMap } from '../../../../lib/abtract/ViesMatFormFieldMap';

// Standalone CRUD list over the global AttributeOption registry. Per spec § 6.2 the
// normal flow is to manage options as nested arrays on the parent AttributeDefinition
// (which is what AttributeDefinitionComponent does inline); this page exists for
// surgical edits — fix a typo across all uses of an option, retire a stale option, etc.
@Component({
  selector: 'app-attribute-option-list',
  templateUrl: './attribute-option-list.component.html',
  styleUrls: ['./attribute-option-list.component.scss'],
  imports: [NgComponentModule]
})
export class AttributeOptionListComponent extends ViesMatFormFieldMap implements OnInit {

  readonly attributeOptionService = inject(AttributeOptionService);
  readonly rxjsUtils = inject(RxJSUtils);
  readonly dialogUtils = inject(DialogUtils);
  readonly router = inject(Router);

  attributeOptionList = signal<AttributeOption[]>([]);
  blankAttributeOption = new AttributeOption();

  addAttributeOption() {
    this.router.navigate([APP_ROUTES.schemaAttributeOption('')]);
  }

  ngOnInit(): void {
    this.attributeOptionService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.attributeOptionList.set([...res]);
      },
      error: err => {
        this.dialogUtils.openErrorMessageFromError(err);
      }
    })
  }

  selectAttributeOption(attributeOption: AttributeOption) {
    this.router.navigate([APP_ROUTES.schemaAttributeOption(attributeOption.id)]);
  }
}
