import { Component, OnInit } from '@angular/core';
import { EnsibleItemService } from '../../service/ensible-item/ensible-item.service';
import { EnsibleItem } from '../../model/ensible.model';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ensible-item-list',
  templateUrl: './ensible-item-list.component.html',
  styleUrls: ['./ensible-item-list.component.scss']
})
export class EnsibleItemListComponent implements OnInit {

  items: EnsibleItem[] = [];
  blankItem: EnsibleItem = new EnsibleItem();

  constructor(
    private ensibleItemService: EnsibleItemService,
    private rxjsUtils: RxJSUtils,
    private router: Router
  ) { }

  ngOnInit(): void {
    // this.ensibleItemService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
    //   next: res => {
    //     this.items = res;
    //   }
    // })   
    
    for(let i = 0; i < 5; i++) {
      let blankItem = new EnsibleItem();
      blankItem.path = '/one';
      blankItem.name = 'one' + i;
      this.items.push(blankItem);
    }

    for(let i = 0; i < 5; i++) {
      let blankItem = new EnsibleItem();
      blankItem.path = '/two';
      blankItem.name = 'two' + i;
      this.items.push(blankItem);
    }

    for(let i = 0; i < 5; i++) {
      let blankItem = new EnsibleItem();
      blankItem.path = '/three/three';
      blankItem.name = 'three' + i;
      this.items.push(blankItem);
    }

    for(let i = 0; i < 5; i++) {
      let blankItem = new EnsibleItem();
      blankItem.path = '/four/four';
      blankItem.name = 'four' + i;
      this.items.push(blankItem);
    }

    for(let i = 0; i < 5; i++) {
      let blankItem = new EnsibleItem();
      blankItem.path = '/one/five';
      blankItem.name = 'five' + i;
      this.items.push(blankItem);
    }
  }

  addItem() {
    this.router.navigate(['item', 0]);
  }

  selectItem(item: EnsibleItem) {
    this.router.navigate(['item', item.id]);
  }
  
  getPath(item: EnsibleItem) {
    return item.path;
  }

  getLabel(item: EnsibleItem) {
    return item.name;
  }
}
