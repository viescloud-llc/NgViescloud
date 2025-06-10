import { Component, Input, OnInit } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { first } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { OpenIdService } from '../../service/open-id.service';
import { AuthenticatorService } from '../../service/authenticator.service';
import { SettingService } from '../../service/setting.service';

export enum DRAWER_STATE {
  OPEN = 'open',
  CLOSE = 'close'
}

@Component({
  selector: 'viescloud-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  @Input()
  drawer?: MatDrawer;

  @Input()
  imageSrc = '';

  @Input()
  useLogoutFlow = false;

  constructor(
    public openIdService: OpenIdService,
    public authenticatorService: AuthenticatorService, 
    private router: Router,
    private settingService: SettingService
    ) { 
      settingService.header = this;
    }

  ngOnInit() {
    this.toggleDrawer(this.settingService.getDisplayDrawer() ? DRAWER_STATE.OPEN : DRAWER_STATE.CLOSE);
    this.authenticatorService.isLoginCall();
  }

  logout(): void {
    this.authenticatorService.logoutWithoutReroute();

    if(this.useLogoutFlow)
      this.openIdService.logoutFlow();
  }

  getURL(): string {
    return document.URL;
  }

  getAlias(): string {
    if(this.authenticatorService.currentUser?.name)
      return this.authenticatorService.currentUser?.name;
    else if(this.authenticatorService.currentUser?.userProfile?.alias)
      return this.authenticatorService.currentUser?.userProfile?.alias;
    else if(this.authenticatorService.currentUser?.userProfile?.firstName && this.authenticatorService.currentUser?.userProfile?.lastName)
      return `${this.authenticatorService.currentUser?.userProfile?.firstName} ${this.authenticatorService.currentUser?.userProfile?.lastName}`
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

    this.drawer?._animationEnd.subscribe({
      next: () => {
        this.settingService.onToggleDisplayDrawerSubject.next(this.drawer?.opened ? DRAWER_STATE.OPEN : DRAWER_STATE.CLOSE);
      }
    });
  }
}
