import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ViescloudUtilsModule } from '../lib/viescloud-utils.module';
import { QuickSideDrawerMenu } from '../lib/share-component/quick-side-drawer-menu/quick-side-drawer-menu.component';
import { environment } from '../environments/environment.prod';
import { ViescloudApplication } from '../lib/abtract/ViescloudApplication.directive';

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
          routerLink: '/product/list'
        }
      ]
    },
    {
      title: 'Settings',
      hideChildren: true,
      children: [
        {
          title: 'Application Setting',
          routerLink: '/setting/application-setting'
        },
        {
          title: 'Account',
          routerLink: '/setting/account',
          hideConditional: () => !this.authenticatorService.isAuthenticatedSync()
        },
        {
          title: 'Users',
          routerLink: '/setting/users',
          hideConditional: () => !this.authenticatorService.hasUserGroup(this.ADMIN_GROUP)
        },
        {
          title: 'User groups',
          routerLink: '/setting/user/groups',
          hideConditional: () => !this.authenticatorService.hasUserGroup(this.ADMIN_GROUP)
        },
        {
          title: 'OpenId Provider',
          routerLink: '/setting/openid-provider',
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
