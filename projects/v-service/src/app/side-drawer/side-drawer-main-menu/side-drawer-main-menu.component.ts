import { Component, EventEmitter, OnInit, Output, forwardRef } from '@angular/core';
import { AuthenticatorService } from 'projects/viescloud-utils/src/lib/service/authenticator.service';
import { SettingService } from 'projects/viescloud-utils/src/lib/service/setting.service';
import { OpenIdService } from 'projects/viescloud-utils/src/lib/service/open-id.service';
import { SideDrawerMenuComponent } from 'projects/viescloud-utils/src/lib/share-component/side-drawer-menu/side-drawer-menu.component';

@Component({
  selector: 'app-side-drawer-main-menu',
  templateUrl: './side-drawer-main-menu.component.html',
  styleUrls: ['./side-drawer-main-menu.component.scss'],
  providers: [{provide: SideDrawerMenuComponent, useExisting: forwardRef(() => SideDrawerMainMenuComponent)}],
})
export class SideDrawerMainMenuComponent extends SideDrawerMenuComponent {

  constructor(public authenticatorService: AuthenticatorService, public settingService: SettingService, public openIdService: OpenIdService) {
    super();
  }

  override ngOnInit() {

  }

  logout() {
    this.authenticatorService.logoutWithoutReroute();
    this.openIdService.logoutFlow();
  }
}
