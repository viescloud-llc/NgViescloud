import { Component, EventEmitter, Input, OnInit, Output, Type, ViewChild, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import { QuickSideDrawerMenuService } from '../../service/QuickSideDrawerMenu.service';

export class QuickSideDrawerMenu {
  title: string = '';
  routerLink?: string;
  routerLinkActive?: string;
  hideConditional?: () => boolean;
  hideChildren?: boolean;
  click?: () => void;
  children?: QuickSideDrawerMenu[];
  loadComponentOnClick?: Type<any>;
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
  isRoot: boolean = true;

  @Input() 
  loadComponent?: Type<any>;

  @Input()
  registerWithService: boolean = true;

  @Output()
  onClickLoadComponent: EventEmitter<Type<any>> = new EventEmitter<Type<any>>();

  @ViewChild('dynamicComponentContainer', { read: ViewContainerRef, static: true })
  container!: ViewContainerRef;

  constructor(
    private router: Router,
    private quickSideDrawerMenuService: QuickSideDrawerMenuService
  ) { }

  ngOnInit() {
    if(this.loadComponent)
      this.onLoadComponent(this.loadComponent);
    else
      this.container.clear();

    if(this.isRoot && this.registerWithService)
      this.quickSideDrawerMenuService.setMenu(this);
  }

  navigateUrl(url: string) {
    this.router.navigate([url]);
  }

  click(item: QuickSideDrawerMenu) {

    if (item.loadComponentOnClick) {
      this.onClickLoadComponent.emit(item.loadComponentOnClick);
    }
    else {
      this.onClickLoadComponent.emit(undefined);
    }
    
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

  /**
   * When a menu item is clicked, this function is called with the component type that should be loaded.
   * If this is the root menu, the component is loaded into the container.
   * @param loadItem The component type to load.
   */
  onLoadComponent(loadItem: Type<any>) {
    if (this.isRoot) {
      this.loadComponent = loadItem;
      this.container.clear();
      if(loadItem)
        this.container.createComponent(loadItem);
    }
  }

  clearLoadComponent() {
    this.loadComponent = undefined;
    this.container.clear();
  }

  back() {
    if(this.container.length > 0) {
      this.container.clear();
    } else {
      this.container.createComponent(this.loadComponent!);
    }
  }
}
