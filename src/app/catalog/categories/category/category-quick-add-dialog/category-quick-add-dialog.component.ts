import { Component, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { NgComponentModule } from '../../../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../../../lib/abtract/ViesMatFormFieldMap';
import { Category } from '../../../../shared/model/product.model';
import { DataUtils } from '../../../../../lib/util/Data.utils';

// Focused popup for quickly creating a NEW Category that will be immediately set
// as the parent of the currently-edited category. Returns the drafted Category
// via `dialogRef.close(cat)` — the CALLER is responsible for POSTing it and
// stamping the resulting id onto the current form. The dialog itself does NO
// backend I/O.
//
// The drafted Category is a plain root (no parentCategoryId) with just the
// hidden decorators respected — form renders name + description only. If the
// admin wants a more elaborate parent, they can navigate to the full editor
// after quick-adding.
@Component({
  selector: 'app-category-quick-add-dialog',
  templateUrl: './category-quick-add-dialog.component.html',
  styleUrls: ['./category-quick-add-dialog.component.scss'],
  imports: [NgComponentModule, MatDialogModule, MatButtonModule]
})
export class CategoryQuickAddDialog extends ViesMatFormFieldMap {

  draft = signal<Category>(DataUtils.purgeValue(new Category()));
  readonly blankCategory = new Category();
  validForm = signal<boolean>(false);

  constructor(private dialogRef: MatDialogRef<CategoryQuickAddDialog, Category | undefined>) {
    super();
  }

  save() {
    this.dialogRef.close(this.draft());
  }

  cancel() {
    this.dialogRef.close(undefined);
  }
}
