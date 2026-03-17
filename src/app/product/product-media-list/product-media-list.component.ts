import { Component, computed, inject, input, signal } from '@angular/core';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { ProductMedia, ProductMediaType } from '../../shared/model/product.model';
import { DataUtils } from '../../../lib/util/Data.utils';
import { DialogUtils } from '../../../lib/util/Dialog.utils';
import { ProductMediaComponent } from '../product-media/product-media.component';

@Component({
  selector: 'app-product-media-list',
  templateUrl: './product-media-list.component.html',
  styleUrls: ['./product-media-list.component.scss'],
  imports: [NgComponentModule, ProductMediaComponent]
})
export class ProductMediaListComponent {

  productMedias = input<ProductMedia[]>([]);
  dialog = input<boolean>(false);

  blankProductMedia = new ProductMedia();
  selectedIndex = signal<number>(0);
  selectedMedia = computed(() => this.productMedias()[this.selectedIndex()]);

  dialogUtils = inject(DialogUtils);

  // Expose enum to template
  readonly ProductMediaType = ProductMediaType;

  selectMedia(index: number) {
    this.selectedIndex.set(index);
  }

  previousMedia() {
    if (this.selectedIndex() > 0) {
      this.selectedIndex.update(i => i - 1);
    }
  }

  nextMedia() {
    if (this.selectedIndex() < this.productMedias().length - 1) {
      this.selectedIndex.update(i => i + 1);
    }
  }

  addMedia() {
    let newMedia = DataUtils.purgeValue(new ProductMedia());

    this.dialogUtils.openDynamicFormDialog(
      newMedia,
      this.blankProductMedia,
      {
        title: 'Add new media',
        yes: 'save',
        no: 'cancel',
        settings: {
          hideRevertButton: true,
          hideRemoveButton: true
        }
      }
    ).then(res => {
      if(res) {
        this.productMedias().push(res.result);
        // Select the newly added media
        this.selectedIndex.set(this.productMedias().length - 1);
      }
    }).catch(() => {
      // User cancelled
    });
  }

  editMedia(index: number) {
    const media = this.productMedias()[index];

    this.dialogUtils.openDynamicFormDialog(
      structuredClone(media),
      this.blankProductMedia,
      {
        title: 'Edit media',
        yes: 'save',
        no: 'cancel'
      }
    ).then(res => {
      if(res) {
        // Update the media
        Object.assign(this.productMedias()[index], res);
      }
    }).catch(() => {
      // User cancelled
    });
  }

  deleteMedia(index: number) {
    this.dialogUtils.openConfirmDialog(
      'Delete Media',
      'Are you sure you want to delete this media?',
      'Delete',
      'Cancel'
    ).then(() => {
      this.productMedias().splice(index, 1);
      // Adjust selected index if needed
      if (this.selectedIndex() >= this.productMedias().length) {
        this.selectedIndex.set(Math.max(0, this.productMedias().length - 1));
      }
    }).catch(() => {
      // User cancelled
    });
  }

  setPrimary(index: number) {
    // Remove primary from all media
    this.productMedias().forEach(m => m.isPrimary = false);
    // Set the selected one as primary
    this.productMedias()[index].isPrimary = true;
  }
}
