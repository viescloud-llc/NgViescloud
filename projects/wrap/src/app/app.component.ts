import { Component, HostListener } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthenticatorService } from 'projects/viescloud-utils/src/lib/service/Authenticator.service';
import { KeyCaptureService } from 'projects/viescloud-utils/src/lib/service/KeyCapture.service';
import { OpenIdService } from 'projects/viescloud-utils/src/lib/service/OpenId.service';
import { SettingService } from 'projects/viescloud-utils/src/lib/service/Setting.service';
import { WrapService } from 'projects/viescloud-utils/src/lib/service/Wrap.service';
import { QuickSideDrawerMenu } from 'projects/viescloud-utils/src/lib/share-component/quick-side-drawer-menu/quick-side-drawer-menu.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

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
      title: 'Wrap',
      children: [
        {
          title: 'Workspace',
          routerLink: '/wrap-workspace',
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

  constructor(
    public router: Router, 
    private authenticatorService: AuthenticatorService,
    private openIdService: OpenIdService,
    private settingService: SettingService,
    private keyCaptureService: KeyCaptureService,
    private matDialog: MatDialog
  ) { 
    settingService.init('wrap');
    this.listenToDialogEvents();
  }

  // Subscribe to MatDialog open and close events
  listenToDialogEvents() {
    this.matDialog.afterOpened.subscribe(() => {
      this.keyCaptureService.disableCapture();
    });

    this.matDialog.afterAllClosed.subscribe(() => {
      this.keyCaptureService.enableCapture();
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    this.keyCaptureService.captureKey(event);
  }

  getBackgroundImageNgStyle(): any {
    if(this.settingService.backgroundImageUrl) {
      let style = {
        'background-image': `url(${this.settingService.backgroundImageUrl})`,
        'background-size': 'cover',
        'background-position': 'center center'
      }
      return style;
    }
    else 
      return '';
  }
}
