import { Component, OnInit } from '@angular/core';
import { UtilsService } from 'projects/viescloud-utils/src/lib/service/Utils.service';
import { QuickSideDrawerMenu } from 'projects/viescloud-utils/src/lib/share-component/quick-side-drawer-menu/quick-side-drawer-menu.component';

@Component({
  selector: 'app-product-menu',
  templateUrl: './product-menu.component.html',
  styleUrls: ['./product-menu.component.scss']
})
export class ProductMenuComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    
  }

  getMenu(): QuickSideDrawerMenu[] {

    let productId = UtilsService.getPathVariable('products');

    let menu: QuickSideDrawerMenu[] = [
      {
        title: 'Overall',
        routerLink: `/marketing/products/${productId}/overall`,
        hideConditional: () => productId === '0'
      },
      {
        title: 'Basic',
        routerLink: `/marketing/products/${productId}/basic`
      },
      {
        title: 'Pinterest',
        routerLink: `/marketing/products/${productId}/pinterest`,
        hideConditional: () => productId === '0'
      }
    ];

    return menu;
  }

}
