import { Component, OnInit } from '@angular/core';
import { EnsibleItemService } from '../../service/ensible-item/ensible-item.service';
import { EnsibleItem } from '../../model/ensible.model';
import { RouteUtils } from 'projects/viescloud-utils/src/lib/util/Route.utils';

@Component({
  selector: 'app-ensible-item',
  templateUrl: './ensible-item.component.html',
  styleUrls: ['./ensible-item.component.scss']
})
export class EnsibleItemComponent implements OnInit {
  
  item!: EnsibleItem;
  blankItem: EnsibleItem = new EnsibleItem();
  
  constructor(
    private ensibleItemService: EnsibleItemService
  ) { }

  ngOnInit(): void {

  }
}
