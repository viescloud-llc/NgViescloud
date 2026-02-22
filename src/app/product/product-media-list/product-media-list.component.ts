import { Component, input, signal } from '@angular/core';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { ProductMedia } from '../../shared/model/product.model';

@Component({
  selector: 'app-product-media-list',
  templateUrl: './product-media-list.component.html',
  styleUrls: ['./product-media-list.component.scss'],
  imports: [NgComponentModule]
})
export class ProductMediaListComponent {

  productMedias = input<ProductMedia[]>([]);
  dialog = input<boolean>(false);
  
}
