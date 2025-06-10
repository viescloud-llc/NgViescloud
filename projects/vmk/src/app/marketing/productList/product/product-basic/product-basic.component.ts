import { AfterContentInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Category, FileLink, PinRequest, Product } from 'projects/viescloud-utils/src/lib/model/affiliate-marketing.model';
import { UtilsService, VFile } from 'projects/viescloud-utils/src/lib/service/utils.service';
import { ProductData } from '../data/product-data.service';
import { firstValueFrom } from 'rxjs';
import { ProductService, ProductCategoryService } from 'projects/viescloud-utils/src/lib/service/affiliateMarketing.service';
import { Router } from '@angular/router';
import { QuickSideDrawerMenuService } from 'projects/viescloud-utils/src/lib/service/quick-side-drawer-menu.service';
import { S3StorageServiceV1 } from 'projects/viescloud-utils/src/lib/service/object-storage-manager.service';
import { RxJSUtils } from 'projects/viescloud-utils/src/lib/util/RxJS.utils';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { DialogUtils } from 'projects/viescloud-utils/src/lib/util/Dialog.utils';

@Component({
  selector: 'app-product-basic',
  templateUrl: './product-basic.component.html',
  styleUrls: ['./product-basic.component.scss']
})
export class ProductBasicComponent implements OnInit, OnChanges {

  product!: Product;
  vFiles: VFile[] = [];
  vFilesCopy: VFile[] = [];

  //blank object
  blankProduct = new Product();

  //input
  selectedFileIndex = 0;
  swapFileIndexInput = 0;
  validInput = false;

  disableProductDisplay = false;

  constructor(
    protected route: Router,
    protected data: ProductData,
    protected productService: ProductService,
    protected s3StorageService: S3StorageServiceV1,
    protected quickSideDrawerMenuService: QuickSideDrawerMenuService,
    protected dialogUtils: DialogUtils,
    protected rxjsUtils: RxJSUtils
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    
  }

  async ngOnInit() {
    this.setDisabledProductDisplay(true);
    this.vFiles = [];
    this.vFilesCopy = [];
    this.product = structuredClone(this.data.product!);
    if(!this.product.fileLinks)
      this.product.fileLinks = [];
    await this.initFetchVFiles();
    this.setDisabledProductDisplay(false);
  }

  async initFetchVFiles() {
    if(this.product.fileLinks) {
      this.product.fileLinks = this.product.fileLinks.filter(e => e.link);
      for(let fileLink of this.product.fileLinks) {
        let vfile = await firstValueFrom(this.s3StorageService.fetchFile(fileLink.link).pipe(this.rxjsUtils.waitLoadingDynamicMessagePopup(`Loading ${fileLink.link}`, 'Dismiss')));
        this.pushVFile(vfile);
        this.vFilesCopy = structuredClone(this.vFiles);
      }
    }
  }

  isProductChange() {
    let vf1 = structuredClone(this.vFiles).map((vf: VFile) => {vf.value = ''; return vf});
    let vf2 = structuredClone(this.vFilesCopy).map((vf: VFile) => {vf.value = ''; return vf});

    let change = UtilsService.isNotEqualWith(this.product, this.data.product, this.blankProduct) || DataUtils.isNotEqual(vf1, vf2);
    change ? this.setEditingComponent() : this.clearEditingComponent();
    return change;
  }

  setEditingComponent() {
    this.data.isEditingComponent = 'basic';
  }

  clearEditingComponent() {
    this.data.isEditingComponent = '';
  }

  async onUploadFile() {
    let vfile = await UtilsService.uploadFileAsVFile("image/jpeg, image/png, image/webp, video/mp4, video/webm");
    this.pushVFile(vfile);
    return vfile;
  }

  onFetchFile(uri: string) {
    return new Promise<VFile>((resolve, reject) => {
      this.s3StorageService.fetchFile(uri)
      .pipe(this.rxjsUtils.waitLoadingDynamicMessagePopup(`Loading ${uri}`, 'Dismiss'))
      .subscribe({
        next: res => {
          this.pushVFile(res);
          resolve(res);
        },
        error: err => {
          this.dialogUtils.openConfirmDialog('Error', `Error loading ${uri}\n${err.message}`, 'OK', '');
          reject(err);
        }
      });
    })
  }

  onRemoveFile(index: number) {
    this.vFiles.splice(index, 1);
    this.vFiles = [...this.vFiles];
    this.selectedFileIndex = this.selectedFileIndex > 0 ? this.selectedFileIndex - 1 : 0;
  }

  pushVFile(vFile: VFile) {
    vFile.name = UtilsService.makeId(30) + '.' + vFile.extension;
    this.vFiles = [...this.vFiles, vFile];
    this.selectedFileIndex = this.vFiles.length - 1;
  }

  reverse() {
    this.ngOnInit();
  }

  async syncVFiles() {
    try {
      // Post new file
      for (const vFile of this.vFiles) {
        if (this.vFilesCopy.findIndex(e => e.name === vFile.name) < 0) {
          const metadata = await firstValueFrom(this.s3StorageService.postFile(vFile).pipe(this.rxjsUtils.waitLoadingDialog()));
          vFile.originalLink = this.s3StorageService.generateViesLinkFromPath(metadata.path!);
        }
      }
  
      // Add link to product if not exist
      for (const vFile of this.vFiles) {
        if (this.product.fileLinks!.findIndex(e => e.link === vFile.originalLink) < 0) {
          this.product.fileLinks!.push({
            id: 0,
            link: vFile.originalLink!,
            mediaType: vFile.type,
            external: false
          });
        }
      }
  
      // Remove link from product if not exist in vFiles
      for (let i = 0; i < this.product.fileLinks!.length; i++) {
        if (this.vFiles.findIndex(e => e.originalLink === this.product.fileLinks![i].link) < 0) {
          const link = this.s3StorageService.extractPathFromViesLink(this.product.fileLinks![i].link);
          await firstValueFrom(this.s3StorageService.deleteFileByPath(link).pipe(this.rxjsUtils.waitLoadingDialog()));
          this.product.fileLinks!.splice(i, 1);
          i--;
        }
      }
    } catch (error) {
      this.dialogUtils.openConfirmDialog('Error', 'Error during file synchronization, please try again or refresh the page if the error persists', 'OK', '');
      throw error;
    }
  }
  
  async save() {
    try {
      await this.syncVFiles();
  
      if (!this.product.id) {
        this.productService.post(this.product).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
          next: res => {
            this.data.product = res;
            this.ngOnInit();
            this.route.navigate(['/marketing/products/', res.id]);
          },
          error: err => {
            this.dialogUtils.openConfirmDialog('Error', 'Error saving product, please try again or refresh the page if the error persists', 'OK', '');
          }
        });
      } else {
        this.productService.put(this.product.id, this.product).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
          next: res => {
            this.data.product = res;
            this.ngOnInit();
          },
          error: err => {
            this.dialogUtils.openConfirmDialog('Error', 'Error saving product, please try again or refresh the page if the error persists', 'OK', '');
          }
        });
      }
    } catch (error) {
      this.dialogUtils.openConfirmDialog('Error', 'Error saving product, please try again or refresh the page if the error persists', 'OK', '');
    }
  }

  setDisabledProductDisplay(disabled: boolean) {
    this.disableProductDisplay = disabled;
  }
}
