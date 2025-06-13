import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { SettingService } from '../../service/setting.service';
import { Router } from '@angular/router';
import { DRAWER_STATE, HeaderComponent } from '../header/header.component';

@Component({
  selector: 'vies-eco-header-minimal',
  templateUrl: './header-minimal.component.html',
  styleUrls: ['./header-minimal.component.scss']
})
export class HeaderMinimalComponent {
  @Input()
  drawer?: MatDrawer;

  @Input()
  imageSrc = '';

  @Input()
  imageLink = '';

  @Input()
  useLogoutFlow = false;

  @Output()
  onLogin: EventEmitter<void> = new EventEmitter();

  @Output()
  onLogout: EventEmitter<void> = new EventEmitter();

  @Input()
  alias: string = '';

  @Input()
  isLogin: boolean = false;

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
    this.onLogin.emit();
  }

  logout(): void {
    this.onLogout.emit();
  }

  getURL(): string {
    return document.URL;
  }

  getAlias(): string {
    return this.alias;
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

  openLink(link: string): void {
    if(link)
      window.open(link);
  }
}
