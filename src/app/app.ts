import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ViescloudUtilsModule } from '../lib/viescloud-utils.module';
import { QuickSideDrawerMenu } from '../lib/share-component/quick-side-drawer-menu/quick-side-drawer-menu.component';
import { environment } from '../environments/environment.prod';
import { ViescloudApplication } from '../lib/abtract/ViescloudApplication.directive';
import { APP_ROUTES } from './app.routes';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ViescloudUtilsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App extends ViescloudApplication {
  readonly ADMIN_GROUP = 'ADMIN';

  menu: QuickSideDrawerMenu[] = [
    {
      title: 'Viescloud',
      children: [
        {
          title: 'Home',
          routerLink: environment.endpoint_home
        },
        {
          title: 'Login',
          routerLink: environment.endpoint_login,
          hideConditional: () => this.authenticatorService.isAuthenticatedSync(),
        },
        {
          title: 'logout',
          routerLink: '/logout',
          hideConditional: () => !this.authenticatorService.isAuthenticatedSync(),
          click: () => this.authenticatorService.logout()
        }
      ]
    },
    {
      title: 'Catalog',
      hideChildren: true,
      hideConditional: () => !this.authenticatorService.isAuthenticatedSync() || !this.authenticatorService.hasUserGroup(this.ADMIN_GROUP),
      children: [
        {
          title: 'Products',
          routerLink: APP_ROUTES.catalogProductList
        },
        {
          title: 'New Product',
          routerLink: APP_ROUTES.catalogProduct('')
        },
        {
          title: 'Categories',
          routerLink: APP_ROUTES.catalogCategoryList
        },
        {
          title: 'New Category',
          routerLink: APP_ROUTES.catalogCategory('')
        },
        {
          title: 'Tags',
          routerLink: APP_ROUTES.catalogTagList
        },
        {
          title: 'New Tag',
          routerLink: APP_ROUTES.catalogTag('')
        }
      ]
    },
    {
      title: 'Commerce',
      hideChildren: true,
      hideConditional: () => !this.authenticatorService.isAuthenticatedSync() || !this.authenticatorService.hasUserGroup(this.ADMIN_GROUP),
      children: [
        {
          title: 'Orders',
          routerLink: APP_ROUTES.commerceOrderList
        },
        {
          title: 'Shipments',
          routerLink: APP_ROUTES.commerceShipmentList
        },
        {
          title: 'Returns',
          routerLink: APP_ROUTES.commerceReturnList
        },
        {
          title: 'Discounts',
          routerLink: APP_ROUTES.commerceDiscountList
        }
      ]
    },
    {
      title: 'Rules',
      hideChildren: true,
      hideConditional: () => !this.authenticatorService.isAuthenticatedSync() || !this.authenticatorService.hasUserGroup(this.ADMIN_GROUP),
      children: [
        {
          title: 'Shipping Rules',
          routerLink: APP_ROUTES.rulesShippingList
        },
        {
          title: 'Tax Rules',
          routerLink: APP_ROUTES.rulesTaxList
        }
      ]
    },
    {
      title: 'Inventory',
      hideChildren: true,
      hideConditional: () => !this.authenticatorService.isAuthenticatedSync() || !this.authenticatorService.hasUserGroup(this.ADMIN_GROUP),
      children: [
        {
          title: 'Stock',
          routerLink: APP_ROUTES.inventoryStock
        },
        {
          title: 'Stock Movements',
          routerLink: APP_ROUTES.inventoryMovements
        }
      ]
    },
    {
      title: 'Shop (Test)',
      hideChildren: true,
      hideConditional: () => !this.authenticatorService.isAuthenticatedSync(),
      children: [
        {
          title: 'Products',
          routerLink: APP_ROUTES.shopProducts
        },
        {
          title: 'Cart',
          routerLink: APP_ROUTES.shopCart
        },
        {
          title: 'My Orders',
          routerLink: APP_ROUTES.shopOrders
        }
      ]
    },
    {
      title: 'Insights',
      hideChildren: true,
      hideConditional: () => !this.authenticatorService.isAuthenticatedSync() || !this.authenticatorService.hasUserGroup(this.ADMIN_GROUP),
      children: [
        {
          title: 'Reports',
          routerLink: APP_ROUTES.reports
        },
        {
          title: 'Reviews',
          routerLink: APP_ROUTES.reviews
        }
      ]
    },
    {
      title: 'Schema',
      hideChildren: true,
      hideConditional: () => !this.authenticatorService.isAuthenticatedSync() || !this.authenticatorService.hasUserGroup(this.ADMIN_GROUP),
      children: [
        {
          title: 'Attribute Definitions',
          routerLink: APP_ROUTES.schemaAttributeDefinitionList
        },
        {
          title: 'New Attribute Definition',
          routerLink: APP_ROUTES.schemaAttributeDefinition('')
        },
        {
          title: 'Attribute Options',
          routerLink: APP_ROUTES.schemaAttributeOptionList
        },
        {
          title: 'New Attribute Option',
          routerLink: APP_ROUTES.schemaAttributeOption('')
        },
      ]
    },
    {
      title: 'Settings',
      hideChildren: true,
      children: [
        {
          title: 'Application Setting',
          routerLink: APP_ROUTES.applicationSetting
        },
        {
          title: 'Account',
          routerLink: APP_ROUTES.accountSetting,
          hideConditional: () => !this.authenticatorService.isAuthenticatedSync()
        },
        {
          title: 'Users',
          routerLink: APP_ROUTES.usersSetting,
          hideConditional: () => !this.authenticatorService.hasUserGroup(this.ADMIN_GROUP)
        },
        {
          title: 'User groups',
          routerLink: APP_ROUTES.userGroupsSetting,
          hideConditional: () => !this.authenticatorService.hasUserGroup(this.ADMIN_GROUP)
        },
        {
          title: 'OpenId Provider',
          routerLink: APP_ROUTES.openidProviderSetting,
          hideConditional: () => !this.authenticatorService.hasUserGroup(this.ADMIN_GROUP)
        }
      ]
    },
    {
      title: 'About',
      hideChildren: true,
      children: [
        {
          title: 'Policy',
          routerLink: '/policy'
        }
      ]
    }
  ];
}
