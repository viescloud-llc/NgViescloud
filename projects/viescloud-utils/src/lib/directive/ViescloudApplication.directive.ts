import { AfterContentInit, AfterViewInit, Directive, HostListener, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { KeyCaptureService } from '../service/KeyCapture.service';
import { SettingService } from '../service/Setting.service';
import { AuthenticatorService } from '../service/Authenticator.service';
import { OpenIdService } from '../service/OpenId.service';

@Directive({
  selector: '[appViescloudApplication]'
})
export abstract class ViescloudApplication implements OnInit {

  constructor(
    protected authenticatorService: AuthenticatorService,
    protected openIdService: OpenIdService,
    protected settingService: SettingService,
    protected keyCaptureService: KeyCaptureService,
    protected matDialog: MatDialog
  ) { 
    this.listenToDialogEvents();
    this.settingService.init(this.getTitle(), this.authenticatorService);
  }

  ngOnInit(): void {
    
  }

  abstract getTitle(): string;

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
    if(this.settingService.backgroundImageUrl) {
      let style = {
        'background-image': `url(${this.settingService.backgroundImageUrl})`,
        'background-size': 'cover',
        'background-position': 'center center'
      }
      return style;
    }
    else 
      return '';
  }

}
