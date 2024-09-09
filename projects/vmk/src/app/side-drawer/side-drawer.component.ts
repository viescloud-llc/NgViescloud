import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SettingService } from 'projects/viescloud-utils/src/lib/service/Setting.service';

@Component({
  selector: 'app-side-drawer',
  templateUrl: './side-drawer.component.html',
  styleUrls: ['./side-drawer.component.scss']
})
export class SideDrawerComponent implements OnInit {

  constructor(public settingService: SettingService) { }

  ngOnInit() {
    
  }

  changeMenu(menu: string) {
    this.settingService.currentMenu = menu;
  }
}