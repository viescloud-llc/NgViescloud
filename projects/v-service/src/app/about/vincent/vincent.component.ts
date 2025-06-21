import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SettingService } from 'projects/viescloud-utils/src/lib/service/setting.service';

@Component({
  selector: 'app-vincent',
  templateUrl: './vincent.component.html',
  styleUrls: ['./vincent.component.scss']
})
export class VincentComponent implements OnInit, OnDestroy {

  constructor(
    private settingService: SettingService,
    private router: Router
  ) { }

  ngOnInit() {
    if(this.isIframe())
      this.settingService.setDisplayHeader(false);
  }

  ngOnDestroy(): void {
    this.settingService.setDisplayHeader(true);
  }

  isIframe(): boolean {
    let urls = this.router.url.split('/');
    return urls.some(u => u === 'iframe');
  }

}
