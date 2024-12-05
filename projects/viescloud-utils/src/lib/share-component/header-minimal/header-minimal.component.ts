import { Component, Input } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { SettingService } from '../../service/Setting.service';
import { Router } from '@angular/router';
import { DRAWER_STATE, HeaderComponent } from '../header/header.component';

@Component({
  selector: 'viescloud-header-minimal',
  templateUrl: './header-minimal.component.html',
  styleUrls: ['./header-minimal.component.scss']
})
export class HeaderMinimalComponent {
  @Input()
  drawer?: MatDrawer;

  @Input()
  imageSrc = '';

  @Input()
  useLogoutFlow = false;

  @Input()
  loginFn?: () => void;

  @Input()
  logoutFn?: () => void;

  @Input()
  getAliasFn?: () => string;

  @Input()
  isLoginFn?: () => boolean;

  constructor(
    private router: Router,
    private settingService: SettingService
    ) { 
      settingService.header = this;
    }

  ngOnInit() {
    this.toggleDrawer(this.settingService.getDisplayDrawer() ? DRAWER_STATE.OPEN : DRAWER_STATE.CLOSE);
  }

  login(): void {
    if(this.loginFn)
      this.loginFn();
  }

  logout(): void {
    if(this.logoutFn)
      this.logoutFn();
  }

  getURL(): string {
    return document.URL;
  }

  isLogin(): boolean {
    if(this.isLoginFn)
      return this.isLoginFn();
    else
      return false;
  }

  getAlias(): string {
    if(this.getAliasFn)
      return this.getAliasFn();
    else
      return ""
  }

  getDisplayHeader(): boolean {
    return this.settingService.getDisplayHeader();
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
  }
}
