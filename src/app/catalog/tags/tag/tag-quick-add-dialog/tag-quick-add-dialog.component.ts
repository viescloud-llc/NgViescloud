import { Component, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { NgComponentModule } from '../../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../../lib/abtract/ViesMatFormFieldMap';
import { DataUtils } from '../../../../../lib/util/Data.utils';
import { Tag } from '../../../../shared/model/product.model';

// Focused popup for quickly creating a NEW Tag from anywhere that consumes tags
// (product editor, future filter tools, etc.). Returns the drafted Tag via
// `dialogRef.close(tag)` — the CALLER is responsible for POSTing it and adding
// it to whatever local pool/selection it needs. The dialog itself does NO
// backend I/O.
@Component({
  selector: 'app-tag-quick-add-dialog',
  templateUrl: './tag-quick-add-dialog.component.html',
  styleUrls: ['./tag-quick-add-dialog.component.scss'],
  imports: [NgComponentModule, MatDialogModule, MatButtonModule]
})
export class TagQuickAddDialog extends ViesMatFormFieldMap {

  draft = signal<Tag>(DataUtils.purgeValue(new Tag()));
  readonly blankTag = new Tag();
  validForm = signal<boolean>(false);

  constructor(private dialogRef: MatDialogRef<TagQuickAddDialog, Tag | undefined>) {
    super();
  }

  save() {
    this.dialogRef.close(this.draft());
  }

  cancel() {
    this.dialogRef.close(undefined);
  }
}
