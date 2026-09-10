import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ViescloudUtilsModule } from '../lib/viescloud-utils.module';
import { QuickSideDrawerMenu } from '../lib/share-component/quick-side-drawer-menu/quick-side-drawer-menu.component';
import { environment } from '../environments/environment.prod';
import { ViescloudApplication } from '../lib/abtract/ViescloudApplication.directive';
import { APP_ROUTES } from './app.routes';
import { MaintenanceService } from '../lib/service/maintenance.service';
import { ViesService } from '../lib/service/rest.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ViescloudUtilsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App extends ViescloudApplication {
  readonly ADMIN_GROUP = 'ADMIN';

  // Maintenance banner: staff bypass the gate, so the shell polls the public
  // status probe (every 60 s) to keep a "maintenance is ON" strip visible —
  // nobody should forget the switch is on.
  readonly maintenance = inject(MaintenanceService);
  readonly systemMaintenanceRoute = APP_ROUTES.systemMaintenance;

  // Nav gate: ANY of the authorities, with the legacy-ADMIN fallback so a
  // pre-6.4 backend (no roles yet) keeps admin navigation intact. UX only —
  // every endpoint is enforced server-side.
  can(authorities: string[]): boolean {
    return this.authenticatorService.isAuthenticatedSync()
      && this.authenticatorService.hasAnyAuthorityOrAdmin(authorities, this.ADMIN_GROUP);
  }

  override ngOnInit(): void {
    super.ngOnInit();
    if (ViesService.isNotCSR()) return;
    this.maintenance.refreshStatus().subscribe({ error: () => { /* offline / no backend */ } });
    setInterval(() => this.maintenance.refreshStatus().subscribe({ error: () => {} }), 60_000);
  }

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
      hideConditional: () => !this.can(['catalog:read']),
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
      hideConditional: () => !this.can(['orders:read', 'shipments:read', 'returns:read', 'discounts:read']),
      children: [
        {
          title: 'Orders',
          routerLink: APP_ROUTES.commerceOrderList,
          hideConditional: () => !this.can(['orders:read'])
        },
        {
          title: 'Shipments',
          routerLink: APP_ROUTES.commerceShipmentList,
          hideConditional: () => !this.can(['shipments:read'])
        },
        {
          title: 'Returns',
          routerLink: APP_ROUTES.commerceReturnList,
          hideConditional: () => !this.can(['returns:read'])
        },
        {
          title: 'Discounts',
          routerLink: APP_ROUTES.commerceDiscountList,
          hideConditional: () => !this.can(['discounts:read'])
        }
      ]
    },
    {
      title: 'Rules',
      hideChildren: true,
      hideConditional: () => !this.can(['rules:read', 'shipping:read']),
      children: [
        {
          title: 'Shipping Rules',
          routerLink: APP_ROUTES.rulesShippingList,
          hideConditional: () => !this.can(['rules:read'])
        },
        {
          title: 'Tax Rules',
          routerLink: APP_ROUTES.rulesTaxList,
          hideConditional: () => !this.can(['rules:read'])
        },
        {
          title: 'Carriers',
          routerLink: APP_ROUTES.rulesCarrierList,
          hideConditional: () => !this.can(['shipping:read'])
        }
      ]
    },
    {
      title: 'Inventory',
      hideChildren: true,
      hideConditional: () => !this.can(['inventory:read']),
      children: [
        {
          title: 'Stock',
          routerLink: APP_ROUTES.inventoryStock
        },
        {
          title: 'Stock Movements',
          routerLink: APP_ROUTES.inventoryMovements
        },
        {
          title: 'Warehouses',
          routerLink: APP_ROUTES.inventoryWarehouseList
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
      title: 'System',
      hideChildren: true,
      hideConditional: () => !this.can(['maintenance:read']),
      children: [
        {
          title: 'Maintenance mode',
          routerLink: APP_ROUTES.systemMaintenance
        }
      ]
    },
    {
      title: 'Insights',
      hideChildren: true,
      hideConditional: () => !this.can(['reports:read', 'reviews:read']),
      children: [
        {
          title: 'Reports',
          routerLink: APP_ROUTES.reports,
          hideConditional: () => !this.can(['reports:read'])
        },
        {
          title: 'Reviews',
          routerLink: APP_ROUTES.reviews,
          hideConditional: () => !this.can(['reviews:read'])
        }
      ]
    },
    {
      title: 'Schema',
      hideChildren: true,
      hideConditional: () => !this.can(['schema:read']),
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
          hideConditional: () => !this.can(['iam:read'])
        },
        {
          title: 'User groups',
          routerLink: APP_ROUTES.userGroupsSetting,
          hideConditional: () => !this.can(['iam:read'])
        },
        {
          title: 'Roles & permissions',
          routerLink: APP_ROUTES.rolesSetting,
          hideConditional: () => !this.can(['iam:read'])
        },
        {
          title: 'OpenId Provider',
          routerLink: APP_ROUTES.openidProviderSetting,
          hideConditional: () => !this.can(['iam:read'])
        },
        {
          title: 'SMTP / outbound mail',
          routerLink: APP_ROUTES.smtpProviderSetting,
          hideConditional: () => !this.can(['smtp:read'])
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
