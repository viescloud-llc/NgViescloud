import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

export class QuickSideDrawerMenu {
  title: string = '';
  routerLink?: string;
  routerLinkActive?: string;
  hideConditional?: () => boolean;
  hideChildren?: boolean;
  click?: () => void;
  children?: QuickSideDrawerMenu[];
}

@Component({
  selector: 'viescloud-quick-side-drawer-menu',
  templateUrl: './quick-side-drawer-menu.component.html',
  styleUrls: ['./quick-side-drawer-menu.component.scss']
})
export class QuickSideDrawerMenuComponent implements OnInit {

  @Input()
  menu!: QuickSideDrawerMenu[];

  constructor(
    private router: Router
  ) { }

  ngOnInit() {

  }

  navigateUrl(url: string) {
    this.router.navigate([url]);
  }

  click(item: QuickSideDrawerMenu) {
    if (item.click) {
      item.click();
    }
    else if (item.routerLink) {
      this.navigateUrl(item.routerLink);
    }
  }

  isHide(item: QuickSideDrawerMenu) {
    if (item.hideConditional) {
      return item.hideConditional();
    }
    return false;
  }

  routerLinkActive(item: QuickSideDrawerMenu) {
    if(this.router.isActive(item.routerLink!, {paths: 'exact', queryParams: 'exact', fragment: 'ignored', matrixParams: 'ignored'})) {
      if(item.routerLinkActive)
        return item.routerLinkActive;
      else
        return 'custom-router-link-active';
    }
    else
      return '';
  }

}
