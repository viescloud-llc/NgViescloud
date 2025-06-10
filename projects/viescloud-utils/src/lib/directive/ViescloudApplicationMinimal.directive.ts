import { Directive, HostListener, OnInit, ViewChild } from '@angular/core';
import { OpenIdService } from '../service/open-id.service';
import { SettingService } from '../service/setting.service';
import { KeyCaptureService } from '../service/key-capture.service';
import { MatDialog } from '@angular/material/dialog';

@Directive({
  selector: '[libViescloudApplicationMinimal]',
  standalone: true,
})
export abstract class ViescloudApplicationMinimal implements OnInit {

  constructor(
    protected settingService: SettingService,
    protected keyCaptureService: KeyCaptureService,
    protected matDialog: MatDialog
  ) {
    this.listenToDialogEvents();
    this.settingService.initMinimal(this.getTitle());
  }

  async ngOnInit() {

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
