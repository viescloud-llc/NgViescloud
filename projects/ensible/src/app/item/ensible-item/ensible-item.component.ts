import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';
import { Component, OnInit } from '@angular/core';
import { EnsibleItemService } from '../../service/ensible-item/ensible-item.service';
import { EnsibleItem } from '../../model/ensible.model';
import { RouteUtils } from 'projects/viescloud-utils/src/lib/util/Route.utils';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { EnsibleWorkspaceParserService } from '../../service/ensible-workspace/ensible-workspace.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ensible-item',
  templateUrl: './ensible-item.component.html',
  styleUrls: ['./ensible-item.component.scss']
})
export class EnsibleItemComponent implements OnInit {

  item!: EnsibleItem;
  itemCopy!: EnsibleItem;
  blankItem: EnsibleItem = new EnsibleItem();

  validForm: boolean = false;

  constructor(
    private ensibleItemService: EnsibleItemService,
    public ensibleWorkspaceParserService: EnsibleWorkspaceParserService,
    private rxjsUtils: RxJSUtils,
    private dialogUtils: DialogUtils,
    private router: Router
  ) { }

  ngOnInit(): void {
    let id = RouteUtils.getPathVariableAsInteger('item');
    if(!id) {
      this.item = new EnsibleItem();
    }
    else {
      this.ensibleItemService.get(id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
        next: res => {
          this.item = res;
          this.itemCopy = structuredClone(this.item);
        }
      })
    }
  }

  isValueChange() {
    return DataUtils.isNotEqual(this.item, this.itemCopy);
  }

  save() {
    this.ensibleItemService.postOrPatch(this.item.id, this.item).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.router.navigate(['item', res.id]);
      },
      error: err => {
        this.dialogUtils.openErrorMessage("Saving Error", 'Error saving item, please try again or refresh the page if the error persists');
      }
    })
  }

  revert() {
    this.item = structuredClone(this.itemCopy);
  }

  async deleteItem() {
    let yes = await this.dialogUtils.openConfirmDialog('Delete Item', 'Are you sure you want to delete this item?', 'Yes', 'No');

    if(!yes) return;

    this.ensibleItemService.delete(this.item.id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: () => {
        this.router.navigate(['item', 'all']);
      },
      error: err => {
        this.dialogUtils.openErrorMessage("Deleting Error", 'Error deleting item, please try again or refresh the page if the error persists');
      }
    })
  }
}
