import { AfterContentChecked, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { EnsibleItemService } from '../../service/ensible-item/ensible-item.service';
import { EnsibleItem } from '../../model/ensible.model';
import { RouteUtils } from 'projects/viescloud-utils/src/lib/util/Route.utils';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { FixChangeDetection } from 'projects/viescloud-utils/src/lib/directive/FixChangeDetection';
import { RouteChangeSubcribe } from 'projects/viescloud-utils/src/lib/directive/RouteChangeSubcribe.directive';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-ensible-item-tab',
  templateUrl: './ensible-item-tab.component.html',
  styleUrls: ['./ensible-item-tab.component.scss']
})
export class EnsibleItemTabComponent extends RouteChangeSubcribe implements AfterContentChecked {

  item!: EnsibleItem;
  itemCopy!: EnsibleItem;

  selectedIndex: number = 0;
  tabNames: string[] = ['Item', 'Run histories', 'Runs'];

  isEditing: boolean = false;

  constructor(
    private ensibleItemService: EnsibleItemService,
    private rxjsUtils: RxJSUtils,
    private cd: ChangeDetectorRef,
    route: ActivatedRoute
  ) {
    super(route);
  }

  ngAfterContentChecked(): void {
    this.cd.detectChanges();
  }

  override async onRouteChange() {
    let id = RouteUtils.getPathVariableAsInteger('item');
    if(!id) {
      this.item = new EnsibleItem();
      this.item.dockerContainerTemplate = undefined;
    }
    else {
      this.ensibleItemService.get(id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
        next: res => {
          this.item = res;
          this.itemCopy = structuredClone(this.item);
        }
      })
    }

    let tabParam = RouteUtils.getQueryParam('tab', true);
    if(tabParam) {
      let index = this.tabNames.findIndex(t => t === tabParam);
      if(index > 0)
        this.selectedIndex = index;
    }
  }

  isValueChange() {
    return DataUtils.isNotEqual(this.item, this.itemCopy);
  }

  indexChanged(index: number) {
    this.selectedIndex = index;
    RouteUtils.setQueryParam('tab', this.tabNames[index]);
  }
}
