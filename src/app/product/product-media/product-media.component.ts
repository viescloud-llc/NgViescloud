import { Component, input } from '@angular/core';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { ProductMedia } from '../../shared/model/product.model';
import { DataUtils } from '../../../lib/util/Data.utils';

@Component({
  selector: 'app-product-media',
  templateUrl: './product-media.component.html',
  styleUrls: ['./product-media.component.scss'],
  imports: [NgComponentModule]
})
export class ProductMediaComponent {
  
  productMedia = input<ProductMedia>(DataUtils.purgeValue(new ProductMedia()));
  blankProductMedia = new ProductMedia();
}
