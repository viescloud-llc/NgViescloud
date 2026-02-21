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
      title: 'Products',
      hideChildren: true,
      hideConditional: () => !this.authenticatorService.isAuthenticatedSync() || !this.authenticatorService.hasUserGroup(this.ADMIN_GROUP),
      children: [
        {
          title: 'list',
          routerLink: APP_ROUTES.productList
        },
        {
          title: 'add',
          routerLink: APP_ROUTES.product(0)
        }
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
