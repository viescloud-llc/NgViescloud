import { Component, inject, input, signal } from '@angular/core';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { ProductMedia } from '../../shared/model/product.model';
import { DataUtils } from '../../../lib/util/Data.utils';
import { DialogUtils } from '../../../lib/util/Dialog.utils';

@Component({
  selector: 'app-product-media-list',
  templateUrl: './product-media-list.component.html',
  styleUrls: ['./product-media-list.component.scss'],
  imports: [NgComponentModule]
})
export class ProductMediaListComponent {

  productMedias = input<ProductMedia[]>([]);
  dialog = input<boolean>(false);

  blankProductMedia = new ProductMedia();

  dialogUtils = inject(DialogUtils);

  addMedia() {
    let newMedia = DataUtils.purgeValue(new ProductMedia());
    // this.productMedias().push(newMedia);

    this.dialogUtils.openDynamicFormDialog(newMedia, this.blankProductMedia, {title: 'Add new media'}).then(res => {
      if(res) {
        console.log(res);
      }
    });
    
  }

  deleteMedia(index: number) {
    this.productMedias().splice(index, 1);
  }
}
