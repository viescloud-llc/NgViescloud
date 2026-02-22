import { Component } from '@angular/core';
import { NgComponentModule } from '../../../lib/module/ng-component.module';

@Component({
  selector: 'app-product-media-list',
  templateUrl: './product-media-list.component.html',
  styleUrls: ['./product-media-list.component.scss'],
  imports: [NgComponentModule]
})
export class ProductMediaListComponent {
  constructor() { }
}
