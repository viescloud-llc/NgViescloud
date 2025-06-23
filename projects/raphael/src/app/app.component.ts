import { Component } from '@angular/core';
import { environment } from 'projects/environments/environment.prod';
import { ViescloudApplication } from 'projects/viescloud-utils/src/lib/abtract/ViescloudApplication.directive';
import { QuickSideDrawerMenu } from 'projects/viescloud-utils/src/lib/share-component/quick-side-drawer-menu/quick-side-drawer-menu.component';
import { TextTtsPanelComponent } from './tts/text-tts/text-tts-panel/text-tts-panel.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends ViescloudApplication {

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
        title: 'TTS',
        hideConditional: () => !this.authenticatorService.isAuthenticatedSync(),
        children: [
          {
            title: 'Simple TTS',
            routerLink: '/tts/simple-tts'
          },
          {
            title: 'Text TTS',
            routerLink: '/tts/text-tts'
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
            hideConditional: () => !this.authenticatorService.hasUserGroup('ADMIN')
          },
          {
            title: 'User groups',
            routerLink: '/setting/user/groups',
            hideConditional: () => !this.authenticatorService.hasUserGroup('ADMIN')
          },
          {
            title: 'OpenId Provider',
            routerLink: '/setting/openid-provider',
            hideConditional: () => !this.authenticatorService.hasUserGroup('ADMIN')
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
