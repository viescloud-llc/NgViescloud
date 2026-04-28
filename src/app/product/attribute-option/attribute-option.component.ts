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

@Component({
  selector: 'app-attribute-option',
  templateUrl: './attribute-option.component.html',
  styleUrls: ['./attribute-option.component.scss'],
  imports: [NgComponentModule]
})
export class AttributeOptionComponent extends ViesMatFormFieldMap implements OnInit {

  attributeOptionService = inject(AttributeOptionService);
  rxjsUtils = inject(RxJSUtils);
  dialogUtils = inject(DialogUtils);

  attributeOption = model<AttributeOption>(DataUtils.purgeArray(new AttributeOption()));
  attributeOptionTrack = ValueTracking.track(this.attributeOption);
  blankAttributeOption = new AttributeOption();
  
  validForm = signal<boolean>(false);

  id = computed(() => {
    return this.attributeOption().id;
  });

  ngOnInit(): void {
    let id = RouteUtils.getPathVariableAsInteger("option");
    if(!this.id() && id) {
      this.attributeOptionService.get(id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
        next: res => {
          this.attributeOption.set(res);
        },
        error: err => {
          this.dialogUtils.openErrorMessageFromError(err);
        }
      })
    }
  }

  save() {
    if(this.id()) {
      this.attributeOptionService.put(this.attributeOption().id, this.attributeOption()).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
        next: res => {
          this.attributeOption.set(res);
        },
        error: err => {
          this.dialogUtils.openErrorMessageFromError(err);
        }
      })
    }
    else {
      this.attributeOptionService.post(this.attributeOption()).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
        next: res => {
          this.attributeOption.set(res);
        },
        error: err => {
          this.dialogUtils.openErrorMessageFromError(err);
        }
      });
    }

  }

  revert() {
    this.attributeOptionTrack.revert();
  }
}
