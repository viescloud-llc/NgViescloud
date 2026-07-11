import { Component, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { NgComponentModule } from '../../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../../lib/abtract/ViesMatFormFieldMap';
import { DataUtils } from '../../../../../lib/util/Data.utils';
import { AttributeOption } from '../../../../shared/model/attribute.model';

// Focused popup for creating a new AttributeOption to add to the parent
// AttributeDefinition's owned `options` array. Does NOT POST to the backend — the
// new option is returned via `dialogRef.close(opt)` and the caller pushes it into
// `value.options`. Cascade-save on the parent definition handles persistence.
@Component({
  selector: 'app-attribute-option-create-dialog',
  templateUrl: './attribute-option-create-dialog.component.html',
  styleUrls: ['./attribute-option-create-dialog.component.scss'],
  imports: [NgComponentModule, MatDialogModule, MatButtonModule]
})
export class AttributeOptionCreateDialog extends ViesMatFormFieldMap {

  draft = signal<AttributeOption>(DataUtils.purgeValue(new AttributeOption()));
  readonly blankOption = new AttributeOption();
  validForm = signal<boolean>(false);

  constructor(private dialogRef: MatDialogRef<AttributeOptionCreateDialog, AttributeOption | undefined>) {
    super();
  }

  save() {
    this.dialogRef.close(this.draft());
  }

  cancel() {
    this.dialogRef.close(undefined);
  }
}
