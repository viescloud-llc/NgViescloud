import { Injectable, Type } from '@angular/core';
import { QuickSideDrawerMenuComponent } from '../share-component/quick-side-drawer-menu/quick-side-drawer-menu.component';

@Injectable({
  providedIn: 'root'
})
export class QuickSideDrawerMenuService {

  private menu?: QuickSideDrawerMenuComponent;

  constructor() { }

  setMenu(menu: QuickSideDrawerMenuComponent) {
    if(menu.isRoot === true && this.menu === undefined)
      this.menu = menu;
  }

  loadComponent(component: Type<any>) {
    if(this.menu)
      this.menu.onLoadComponent(component);
  }

}
