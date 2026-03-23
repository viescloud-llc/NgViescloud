import { Component, computed, effect, inject, input, model, signal } from '@angular/core';
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

  productMedias = model<ProductMedia[]>([]);
  dialog = input<boolean>(false);

  blankProductMedia = new ProductMedia();
  selectedIndex = signal<number>(0);
  selectedMedia = computed(() => this.productMedias()[this.selectedIndex()]);

  dialogUtils = inject(DialogUtils);

  // Expose enum to template
  readonly ProductMediaType = ProductMediaType;

  constructor() {
    // Adjust selectedIndex when array length changes
    effect(() => {
      const length = this.productMedias().length;
      const currentIndex = this.selectedIndex();

      if (currentIndex >= length && length > 0) {
        this.selectedIndex.set(length - 1);
      } else if (length === 0) {
        this.selectedIndex.set(0);
      }
    });
  }

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
      if(res.sucess) {
        // Create new array reference to trigger change detection
        this.productMedias.set([...this.productMedias(), res.result]);
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
      if(res.sucess) {
        // Create new array with updated media
        const updated = [...this.productMedias()];
        updated[index] = res.result;
        this.productMedias.set(updated);
      }
      else if(res.remove) {
        this.deleteMedia(index);
      }
    })
  }

  deleteMedia(index: number) {
    this.dialogUtils.openConfirmDialog(
      'Delete Media',
      'Are you sure you want to delete this media?',
      'Delete',
      'Cancel'
    ).then(res => {
      if(res) {
        // Create new array without the deleted item
        const updated = this.productMedias().filter((_, i) => i !== index);
        this.productMedias.set(updated);
        // Effect will automatically adjust selectedIndex if needed
      }
    });
  }

  setPrimary(index: number) {
    // Create new array with updated primary status
    const updated = this.productMedias().map((m, i) => ({
      ...m,
      isPrimary: i === index
    }));
    this.productMedias.set(updated);
  }
}
