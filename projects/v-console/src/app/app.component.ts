import { Component } from '@angular/core';
import { ViescloudApplication } from 'projects/viescloud-utils/src/lib/directive/ViescloudApplication.directive';
import { QuickSideDrawerMenu } from 'projects/viescloud-utils/src/lib/share-component/quick-side-drawer-menu/quick-side-drawer-menu.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends ViescloudApplication {
  override getTitle(): string {
    return 'v-console';
  }

  menu: QuickSideDrawerMenu[] = [
    {
      title: 'Viescloud',
      children: [
        {
          title: 'Home',
          routerLink: '/home'
        },
        {
          title: 'Login',
          routerLink: '/login',
          hideConditional: () => this.authenticatorService.isLoginB,
          click: () => this.openIdService.authorizeFlow()
        },
        {
          title: 'logout',
          routerLink: '/logout',
          hideConditional: () => !this.authenticatorService.isLoginB,
          click: () => this.authenticatorService.logoutWithoutReroute()
        }
      ]
    },
    {
      title: 'Tool',
      children: [
        {
          title: 'Request Sender',
          routerLink: '/tool/request_sender',
        }
      ]
    },
    {
      title: 'Venkins',
      hideConditional: () => !this.authenticatorService.isLoginB,
      children: [
        {
          title: 'Home',
          routerLink: '/venkins/home',
        },
        {
          title: 'Config map',
          routerLink: 'venkins/config_map',
        }
      ]
    },
    {
      title: 'DNS',
      hideConditional: () => !this.authenticatorService.isLoginB,
      children: [
        {
          title: 'Manager',
          routerLink: '/dns-manager',
        }
      ]
    },
    {
      title: 'Authentication',
      hideConditional: () => !this.authenticatorService.isLoginB,
      children: [
        {
          title: 'Route',
          children: [
            {
              title: 'Manual',
              routerLink: '/authentication/route',
            },
            {
              title: 'Auto',
              routerLink: '/authentication/auto_route',
            }
          ]
        },
        {
          title: 'User',
          children: [
            {
              title: 'list',
              routerLink: '/authentication/users',
            },
            {
              title: 'role',
              routerLink: '/authentication/user_role',
            }
          ]
        }
      ]
    },
    {
      title: 'VGame',
      hideConditional: () => !this.authenticatorService.isLoginB,
      children: [
        {
          title: 'Question',
          routerLink: '/vgame/question',
        }
      ]
    },
    {
      title: 'Settings',
      children: [
        {
          title: 'Application Setting',
          routerLink: '/setting/application-setting'
        }
      ]
    },
    {
      title: 'About',
      children: [
        {
          title: 'Policy',
          routerLink: '/policy'
        }
      ]
    }
  ]
  
}
