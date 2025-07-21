import { Directive, HostListener, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { KeyCaptureService } from '../service/key-capture.service';
import { SettingService } from '../service/setting.service';
import { AuthenticatorService } from '../service/authenticator.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment.prod';

@Directive({
  selector: '[appViescloudApplication]',
  standalone: false
})
export abstract class ViescloudApplication implements OnInit {

  protected environment = environment;

  constructor(
    protected authenticatorService: AuthenticatorService,
    protected settingService: SettingService,
    protected keyCaptureService: KeyCaptureService,
    protected matDialog: MatDialog,
    protected router: Router,
  ) { 
    this.listenToDialogEvents();
    this.settingService.init();
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
