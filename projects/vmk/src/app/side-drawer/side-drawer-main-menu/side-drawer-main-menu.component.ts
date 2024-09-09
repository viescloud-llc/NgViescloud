import { Component, EventEmitter, OnInit, Output, forwardRef } from '@angular/core';
import { AuthenticatorService } from 'projects/viescloud-utils/src/lib/service/Authenticator.service';
import { SettingService } from 'projects/viescloud-utils/src/lib/service/Setting.service';
import { SideDrawerMenuComponent } from 'projects/viescloud-utils/src/lib/share-component/side-drawer-menu/side-drawer-menu.component';

@Component({
  selector: 'app-side-drawer-main-menu',
  templateUrl: './side-drawer-main-menu.component.html',
  styleUrls: ['./side-drawer-main-menu.component.scss'],
  providers: [{provide: SideDrawerMenuComponent, useExisting: forwardRef(() => SideDrawerMainMenuComponent)}],
})
export class SideDrawerMainMenuComponent extends SideDrawerMenuComponent {

  constructor(public authenticatorService: AuthenticatorService, public settingService: SettingService) {
    super();
  }

  override ngOnInit() {

  }
}
