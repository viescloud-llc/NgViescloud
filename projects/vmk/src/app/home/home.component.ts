import { Component, OnInit } from '@angular/core';
import { PopupUtils } from 'projects/viescloud-utils/src/lib/util/Popup.utils';
import { StringUtils } from 'projects/viescloud-utils/src/lib/util/String.utils';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  count = 0;

  constructor(
    private popupUtils: PopupUtils
  ) { }

  ngOnInit() {

  }

  getURL(): string {
    return document.URL;
  }

  popup() {
    this.popupUtils.openDynamicMessagePopup(`Count (${this.count++}): ${StringUtils.makeId(100)}`, 'ok', 40, "bottom", "right", 10000);
  }

}
