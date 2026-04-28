import { Component, model, signal } from '@angular/core';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { AttributeDefinition } from '../../shared/model/product.model';
import { DataUtils } from '../../../lib/util/Data.utils';
import { ViesMatFormFieldMap } from '../../../lib/abtract/ViesMatFormFieldMap';
import { ValueTracking } from '../../../lib/abtract/valueTracking.directive';

@Component({
  selector: 'app-attribute-definition',
  templateUrl: './attribute-definition.component.html',
  styleUrls: ['./attribute-definition.component.scss'],
  imports: [NgComponentModule]
})
export class AttributeDefinitionComponent extends ViesMatFormFieldMap {

  attributeDefinition = model<AttributeDefinition>(DataUtils.purgeArray(new AttributeDefinition()));
  attributeDefinitionTrack = ValueTracking.track(this.attributeDefinition);
  blankAttributeDefinition = new AttributeDefinition();

  validForm = signal<boolean>(false);

  save() {
    
  }

  delete() {

  }

  revert() {
    this.attributeDefinitionTrack.revert();
  }
}
