import { Component, OnInit } from '@angular/core';
import { UtilsService } from 'projects/viescloud-utils/src/lib/service/utils.service';
import { QuickSideDrawerMenu } from 'projects/viescloud-utils/src/lib/share-component/quick-side-drawer-menu/quick-side-drawer-menu.component';
import { ProductData } from '../data/product-data.service';
import { PinterestOathTokenService } from 'projects/viescloud-utils/src/lib/service/affiliateMarketing.service';

@Component({
  selector: 'app-product-menu',
  templateUrl: './product-menu.component.html',
  styleUrls: ['./product-menu.component.scss']
})
export class ProductMenuComponent implements OnInit {

  constructor(
    private data: ProductData,
    private pinterestOathTokenService: PinterestOathTokenService
  ) { }

  ngOnInit() {
    
  }

  getMenu(): QuickSideDrawerMenu[] {

    let productId = UtilsService.getPathVariable('products');

    let menu: QuickSideDrawerMenu[] = [
      {
        title: 'Overall',
        routerLink: `/marketing/products/${productId}/overall`,
        hideConditional: () => productId === '0',
        disableConditional: () => !(this.data.isEditingComponent === '' || this.data.isEditingComponent === 'overall')
      },
      {
        title: 'Basic',
        routerLink: `/marketing/products/${productId}/basic`,
        disableConditional: () => !(this.data.isEditingComponent === '' || this.data.isEditingComponent === 'basic')
      },
      {
        title: 'Pinterest',
        routerLink: `/marketing/products/${productId}/pinterest`,
        hideConditional: () => productId === '0' || !this.pinterestOathTokenService.pinterestOathToken,
        disableConditional: () => !(this.data.isEditingComponent === '' || this.data.isEditingComponent === 'pinterest')
      }
    ];

    return menu;
  }

}
