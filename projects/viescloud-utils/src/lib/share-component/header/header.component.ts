import { Component, Input, OnInit } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { first } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticatorService } from '../../service/authenticator.service';
import { SettingService } from '../../service/setting.service';
import { environment } from 'projects/environments/environment.prod';

export enum DRAWER_STATE {
  OPEN = 'open',
  CLOSE = 'close'
}

@Component({
  selector: 'vies-eco-header',
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
    public authenticatorService: AuthenticatorService, 
    private settingService: SettingService,
    private router: Router
    ) { 
      settingService.header = this;
    }

  ngOnInit() {
    this.toggleDrawer(this.settingService.getDisplayDrawer() ? DRAWER_STATE.OPEN : DRAWER_STATE.CLOSE);
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
