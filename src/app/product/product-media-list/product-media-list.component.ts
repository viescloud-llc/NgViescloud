import { Component, input, signal } from '@angular/core';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { ProductMedia } from '../../shared/model/product.model';
import { DataUtils } from '../../../lib/util/Data.utils';
import { ProductMediaComponent } from '../product-media/product-media.component';

@Component({
  selector: 'app-product-media-list',
  templateUrl: './product-media-list.component.html',
  styleUrls: ['./product-media-list.component.scss'],
  imports: [NgComponentModule, ProductMediaComponent]
})
export class ProductMediaListComponent {

  productMedias = input<ProductMedia[]>([]);
  blankProductMedia = new ProductMedia();
  dialog = input<boolean>(false);

  addMedia() {
    let newMedia = DataUtils.purgeValue(new ProductMedia());
    this.productMedias().push(newMedia);
  }
}
