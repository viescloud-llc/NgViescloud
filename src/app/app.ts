import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ViescloudUtilsModule } from '../lib/viescloud-utils.module';
import { QuickSideDrawerMenu } from '../lib/share-component/quick-side-drawer-menu/quick-side-drawer-menu.component';
import { environment } from '../environments/environment.prod';
import { ViescloudApplication } from '../lib/abtract/ViescloudApplication.directive';
import { APP_ROUTES } from './app.routes';
import { StoreSettingsService } from './shared/service/store-settings/store-settings.service';
import { ViesService } from '../lib/service/rest.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ViescloudUtilsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App extends ViescloudApplication {

  // Store name / currency / logo for the shell (public info only — no admin reads here).
  private readonly storeSettings = inject(StoreSettingsService);

  override ngOnInit(): void {
    super.ngOnInit();
    if (ViesService.isNotCSR()) return;
    this.storeSettings.loadPublic().subscribe({ error: () => {} });
  }

  menu: QuickSideDrawerMenu[] = [
    {
      title: 'Shop',
      children: [
        {
          title: 'Home',
          routerLink: environment.endpoint_home
        },
        {
          title: 'Products',
          routerLink: APP_ROUTES.shopProducts
        },
        {
          title: 'Cart',
          routerLink: APP_ROUTES.shopCart,
          hideConditional: () => !this.authenticatorService.isAuthenticatedSync()
        },
        {
          title: 'My orders',
          routerLink: APP_ROUTES.shopOrders,
          hideConditional: () => !this.authenticatorService.isAuthenticatedSync()
        }
      ]
    },
    {
      title: 'Account',
      children: [
        {
          title: 'Login',
          routerLink: environment.endpoint_login,
          hideConditional: () => this.authenticatorService.isAuthenticatedSync(),
        },
        {
          title: 'Account',
          routerLink: APP_ROUTES.accountSetting,
          hideConditional: () => !this.authenticatorService.isAuthenticatedSync()
        },
        {
          title: 'Application setting',
          routerLink: APP_ROUTES.applicationSetting
        },
        {
          title: 'Logout',
          routerLink: '/logout',
          hideConditional: () => !this.authenticatorService.isAuthenticatedSync(),
          click: () => this.authenticatorService.logout()
        }
      ]
    }
  ];
}
