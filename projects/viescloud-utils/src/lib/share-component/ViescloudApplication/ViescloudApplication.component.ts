import { Component, HostListener, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { KeyCaptureService } from '../../service/KeyCapture.service';
import { SettingService } from '../../service/Setting.service';
import { PrebuildTheme } from '../../model/Mat.model';

@Component({
  selector: 'app-ViescloudApplication',
  templateUrl: './ViescloudApplication.component.html',
  styleUrls: ['./ViescloudApplication.component.scss']
})
export class ViescloudApplication implements OnInit {

  constructor(
    protected matDialog: MatDialog,
    protected keyCaptureService: KeyCaptureService,
    protected settingService: SettingService,
  ) { 
    this.listenToDialogEvents();
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
