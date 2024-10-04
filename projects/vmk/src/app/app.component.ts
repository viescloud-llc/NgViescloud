import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AuthenticatorService } from 'projects/viescloud-utils/src/lib/service/Authenticator.service';
import { KeyCaptureService } from 'projects/viescloud-utils/src/lib/service/KeyCapture.service';
import { OpenIdService } from 'projects/viescloud-utils/src/lib/service/OpenId.service';
import { SettingService } from 'projects/viescloud-utils/src/lib/service/Setting.service';
import { QuickSideDrawerMenu } from 'projects/viescloud-utils/src/lib/share-component/quick-side-drawer-menu/quick-side-drawer-menu.component';
import { ViescloudApplication } from 'projects/viescloud-utils/src/lib/share-component/ViescloudApplication/ViescloudApplication.component';
import { ProductMenuComponent } from './marketing/productList/product/product-menu/product-menu.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends ViescloudApplication {
  title = 'vmk';

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
      title: 'Marketing',
      hideConditional: () => !this.authenticatorService.isLoginB,
      children: [
        {
          title: 'Products',
          routerLink: '/marketing/products'
        },
        {
          title: 'Categories',
          routerLink: '/marketing/categories',
        }
      ]
    },
    {
      title: 'Settings',
      children: [
        {
          title: 'Connected Service',
          routerLink: '/setting/connected-service',
          hideConditional: () => !this.authenticatorService.isLoginB
        },
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
          routerLink: '/about/policies'
        }
      ]
    }
  ]

  constructor(
    override matDialog: MatDialog,
    override keyCaptureService: KeyCaptureService,
    override settingService: SettingService,
    private authenticatorService: AuthenticatorService,
    private openIdService: OpenIdService
  ) {
    super(matDialog, keyCaptureService, settingService);
    settingService.init(this.title, authenticatorService);
  }
}
