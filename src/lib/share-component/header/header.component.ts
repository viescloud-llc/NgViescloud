import { Component, Input, OnInit } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { AuthenticatorService } from '../../service/authenticator.service';
import { SettingService } from '../../service/setting.service';
import { environment } from '../../../environments/environment.prod';

export enum DRAWER_STATE {
  OPEN = 'open',
  CLOSE = 'close'
}

@Component({
  selector: 'vies-eco-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false
})
export class HeaderComponent implements OnInit {

  @Input()
  drawer?: MatDrawer;

  @Input()
  imageSrc = '';

  @Input()
  useLogoutFlow = false;

  constructor(
    public authenticatorService: AuthenticatorService, 
    private settingService: SettingService,
    private router: Router
    ) { 

    }

  ngOnInit() {
    let intialDisplayDrawer = this.settingService.applicationSetting.get<boolean>('primitive', ...this.settingService.DEFAULT_GENERAL_SETTING_PATHS.initalDisplayDrawer) ?? true;
    this.settingService.applicationSetting.set(intialDisplayDrawer, ...this.settingService.DEFAULT_GENERAL_SETTING_PATHS.displayDrawer);
    let displayDrawer = this.settingService.applicationSetting.get<boolean>('primitive', ...this.settingService.DEFAULT_GENERAL_SETTING_PATHS.displayDrawer) ?? true;
    this.toggleDrawer(displayDrawer ? DRAWER_STATE.OPEN : DRAWER_STATE.CLOSE);

    let intialDisplayHeader = this.settingService.applicationSetting.get<boolean>('primitive', ...this.settingService.DEFAULT_GENERAL_SETTING_PATHS.initalDisplayHeader) ?? true;
    this.settingService.applicationSetting.set(intialDisplayHeader, ...this.settingService.DEFAULT_GENERAL_SETTING_PATHS.displayHeader);
  }

  login(): void {
    this.router.navigate([environment.endpoint_login]);
  }

  logout(): void {
    this.authenticatorService.logOutManually();
  }

  getURL(): string {
    return document.URL;
  }

  getAlias(): string {
    return this.authenticatorService.getCurrentUserAliasOrUsername();
  }

  toggleDrawer(state?: DRAWER_STATE): void {
    if(state) {
      if(state === DRAWER_STATE.OPEN)
        this.drawer?.open();
      else if(state === DRAWER_STATE.CLOSE)
        this.drawer?.close();
    }
    else
      this.drawer?.toggle();

    this.drawer?._animationEnd.subscribe({
      next: () => {
        this.settingService.applicationSetting.set(this.drawer?.opened ?? false, ...this.settingService.DEFAULT_GENERAL_SETTING_PATHS.displayDrawer);
      }
    });
  }

  isDisplayHeader() {
    return this.settingService.applicationSetting.get<boolean>('primitive', ...this.settingService.DEFAULT_GENERAL_SETTING_PATHS.displayHeader) ?? true;
  }
}
