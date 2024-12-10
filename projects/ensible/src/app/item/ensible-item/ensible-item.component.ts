import { Component, OnInit } from '@angular/core';
import { EnsibleItemService } from '../../service/ensible-item/ensible-item.service';
import { EnsibleItem } from '../../model/ensible.model';
import { RouteUtils } from 'projects/viescloud-utils/src/lib/util/Route.utils';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';

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
    private rxjsUtils: RxJSUtils
  ) { }

  ngOnInit(): void {
    let id = RouteUtils.getPathVariable('item');
    if(id === '0') {
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
    
  }

  revert() {
    this.item = structuredClone(this.itemCopy);
  }
}
