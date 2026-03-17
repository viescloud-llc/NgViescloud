import { Component, input } from '@angular/core';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { ProductMedia, ProductMediaType } from '../../shared/model/product.model';

@Component({
  selector: 'app-product-media',
  templateUrl: './product-media.component.html',
  styleUrls: ['./product-media.component.scss'],
  imports: [NgComponentModule]
})
export class ProductMediaComponent {
  productMedia = input.required<ProductMedia>();

  // Expose enum to template
  readonly ProductMediaType = ProductMediaType;
}
