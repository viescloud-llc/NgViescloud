import { Component, OnInit } from '@angular/core';
import { EnsibleItemService } from '../../service/ensible-item/ensible-item.service';
import { EnsibleItem } from '../../model/ensible.model';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { Router } from '@angular/router';
import { EnsibleSettingService } from '../../service/ensible-setting/ensible-setting.service';
import { EnsibleSetting } from '../../model/ensible.setting.model';

@Component({
  selector: 'app-ensible-item-list',
  templateUrl: './ensible-item-list.component.html',
  styleUrls: ['./ensible-item-list.component.scss']
})
export class EnsibleItemListComponent implements OnInit {

  items: EnsibleItem[] = [];
  blankItem: EnsibleItem = new EnsibleItem();

  useTable = false;

  currentPath = '/';

  constructor(
    private ensibleItemService: EnsibleItemService,
    private rxjsUtils: RxJSUtils,
    private router: Router,
    private ensibleSettingService: EnsibleSettingService
  ) { }

  ngOnInit(): void {
    this.ensibleItemService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.items = res;
      }
    })

    this.useTable = !this.ensibleSettingService.getCopyOfGeneralSetting<EnsibleSetting>().UseTreeDisplayForItemList;
  }

  addItem() {
    this.router.navigate(["item", 0], {queryParams: {path: this.currentPath}});
  }

  selectItem(item: EnsibleItem) {
    this.router.navigate(['item', item.id]);
  }

  getPath(item: EnsibleItem) {
    return item.path;
  }

  getLabel(item: EnsibleItem) {
    return item.name;
  }
}
