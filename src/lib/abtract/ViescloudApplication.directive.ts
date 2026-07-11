import { Directive, HostListener, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { KeyCaptureService } from '../service/key-capture.service';
import { SettingService } from '../service/setting.service';
import { AuthenticatorService } from '../service/authenticator.service';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, RouteConfigLoadEnd, RouteConfigLoadStart, Router } from '@angular/router';
import { environment } from '../../environments/environment.prod';

@Directive({
  selector: '[appViescloudApplication]',
  standalone: false
})
export abstract class ViescloudApplication implements OnInit {

  protected environment = environment;

  // True while a lazy-loaded route chunk is being fetched OR while a navigation is
  // in flight. Subclass templates can render a progress bar / spinner against this:
  //
  //   @if (isLazyChunkLoading()) {
  //     <mat-progress-bar mode="indeterminate"></mat-progress-bar>
  //   }
  //
  // The signal tracks both `RouteConfigLoadStart/End` (the actual chunk fetch) and
  // `NavigationStart/End/Cancel/Error` (the surrounding navigation, including the
  // brief window between chunk-loaded and route-activated). Belt-and-suspenders so
  // the bar stays visible across the whole "user clicked → screen ready" gap.
  readonly isLazyChunkLoading = signal(false);

  constructor(
    protected authenticatorService: AuthenticatorService,
    protected settingService: SettingService,
    protected keyCaptureService: KeyCaptureService,
    protected matDialog: MatDialog,
    protected router: Router,
  ) {
    this.listenToDialogEvents();
    this.listenToRouterEvents();
    this.settingService.init();
  }

  private listenToRouterEvents() {
    this.router.events.subscribe(event => {
      if (event instanceof RouteConfigLoadStart || event instanceof NavigationStart) {
        this.isLazyChunkLoading.set(true);
      } else if (
        event instanceof RouteConfigLoadEnd ||
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.isLazyChunkLoading.set(false);
      }
    });
  }

  ngOnInit(): void {

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
    let backgroundImageUrl = this.settingService.applicationSetting.get<string>('primitive', ...this.settingService.DEFAULT_GENERAL_SETTING_PATHS.backgroundImageUrl) ?? '';

    if(backgroundImageUrl) {
      let style = {
        'background-image': `url(${backgroundImageUrl})`,
        'background-size': 'cover',
        'background-position': 'center center'
      }
      return style;
    }
    else 
      return '';
  }

}
