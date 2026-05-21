import { Component, computed, inject, input, linkedSignal, OnInit, output, signal } from '@angular/core';
import { DialogUtils } from '../../../lib/util/Dialog.utils';
import { RxJSUtils } from '../../../lib/util/RxJS.utils';
import { AttributeOptionService } from '../../shared/service/attribute-option/attribute-option.service';
import { AttributeOption } from '../../shared/model/product.model';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { APP_ROUTES } from '../../app.routes';
import { Router } from '@angular/router';
import { MatOption } from '../../../lib/model/mat.model';
import { ViesMatFormFieldMap } from '../../../lib/abtract/ViesMatFormFieldMap';

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

  selectedAttributeOptions: AttributeOption[] = [];

  options = computed(() => {
    return this.attributeOptionList().map(attributeOption => {
      let options: MatOption<AttributeOption> = {
        value: attributeOption,
        valueLabel: attributeOption.displayValue
      }
      return options;
    });
  });

  showTable = input<boolean>(true);
  _showTable = linkedSignal(() => this.showTable());

  onSelected = output<AttributeOption>();

  addAttributeOption() {
    this.router.navigate([APP_ROUTES.productAttributeOption(0)]);
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

  selectedAttributeOption(attributeOption: AttributeOption) {
    if(this._showTable()) {
      this.router.navigate([APP_ROUTES.productAttributeOption(attributeOption.id)]);
    }
    else {
      this.onSelected.emit(attributeOption);
    }
  }
}
