import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

export class QuickSideDrawerMenu {
  title: string = '';
  routerLink?: string;
  hideConditional?: boolean;
  hideChildren?: boolean;
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

  @Input()
  router!: Router;

  constructor() { }

  ngOnInit() {

  }

  navigateUrl(url: string) {
    this.router.navigate([url]);
  }

}
