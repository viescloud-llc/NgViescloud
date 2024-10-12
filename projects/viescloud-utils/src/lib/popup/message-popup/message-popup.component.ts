import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component, Inject, Input, OnInit } from '@angular/core';
import { SettingService } from '../../service/Setting.service';
import { POPUP_DATA, POPUP_DISMISS } from '../../model/Popup.model';
import { StringUtils } from '../../util/String.utils';

@Component({
  selector: 'app-message-popup',
  templateUrl: './message-popup.component.html',
  styleUrls: ['./message-popup.component.scss'],
  animations: [
    trigger('popupAnimation', [
      state('void', style({ opacity: 0, transform: 'translateY(100%)' })),
      state('enter', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('void => enter', [animate('300ms ease-in')]),
      transition('enter => void', [animate('300ms ease-out')]),
    ])
  ]
})
export class MessagePopup implements OnInit {

  fullMessage: string;
  truncatedMessage: string;
  dismissLabel: string = '';
  viewFullOnHover: boolean = false;
  isHovered: boolean = false;
  textColor;
  
  constructor(
    @Inject(POPUP_DATA) public data: { message: string , maxLength?: number, dismissLabel?: string, viewFullOnHover?: boolean},
    @Inject(POPUP_DISMISS) public dismiss: () => void,
    settingService: SettingService
  ) {
    this.textColor = settingService.getCurrentThemeTextColor();
    this.fullMessage = data.message;
    this.truncatedMessage = data.maxLength ? StringUtils.getMaxString(data.message, data.maxLength) : data.message;
    this.dismissLabel = data.dismissLabel ?? '';
    this.viewFullOnHover = data.viewFullOnHover ?? false;
  }

  ngOnInit(): void {
  }

  dismissFn() {
    this.dismiss();
  }
}
