import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'viescloud-side-drawer-menu',
  templateUrl: './side-drawer-menu.component.html',
  styleUrls: ['./side-drawer-menu.component.scss']
})
export class SideDrawerMenuComponent implements OnInit {

  @Output()
  onBack: EventEmitter<void> = new EventEmitter();

  @Output()
  onChangeMenu: EventEmitter<string> = new EventEmitter();

  constructor() { }

  ngOnInit() {
    
  }

  emitOnBack() {
    this.onBack.emit();
  }

  emitOnChangeMenu(menu: string) {
    this.onChangeMenu.emit(menu);
  }

}
