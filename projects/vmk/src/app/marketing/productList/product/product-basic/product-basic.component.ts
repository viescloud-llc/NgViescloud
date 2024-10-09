import { AfterContentInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Category, FileLink, PinRequest, Product } from 'projects/viescloud-utils/src/lib/model/AffiliateMarketing.model';
import { UtilsService, VFile } from 'projects/viescloud-utils/src/lib/service/Utils.service';
import { ProductData } from '../data/product-data.service';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ProductService, ProductCategoryService } from 'projects/viescloud-utils/src/lib/service/AffiliateMarketing.service';
import { SmbService } from 'projects/viescloud-utils/src/lib/service/Smb.service';
import { Router } from '@angular/router';
import { ConfirmDialog } from 'projects/viescloud-utils/src/lib/dialog/confirm-dialog/confirm-dialog.component';
import { QuickSideDrawerMenuService } from 'projects/viescloud-utils/src/lib/service/QuickSideDrawerMenu.service';
import { ProductMenuComponent } from '../product-menu/product-menu.component';
import { S3StorageServiceV1 } from 'projects/viescloud-utils/src/lib/service/ObjectStorageManager.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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

  constructor(
    protected matDialog: MatDialog,
    protected productService: ProductService,
    protected s3StorageService: S3StorageServiceV1,
    protected route: Router,
    protected data: ProductData,
    protected snackBar: MatSnackBar,
    protected quickSideDrawerMenuService: QuickSideDrawerMenuService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    
  }

  ngOnInit() {
    this.vFiles = [];
    this.vFilesCopy = [];
    this.product = structuredClone(this.data.product);
    if(!this.product.fileLinks)
      this.product.fileLinks = [];
    this.initFetchVFiles();
  }

  initFetchVFiles() {
    if(this.product.fileLinks) {
      this.product.fileLinks = this.product.fileLinks.filter(e => e.link);
      this.product.fileLinks.forEach(fileLink => {
        this.s3StorageService.fetchFile(fileLink.link)
          .pipe(UtilsService.waitLoadingSnackBarDynamicString(this.snackBar, `Loading ${fileLink.link}`))
          .subscribe({
            next: res => {
              this.pushVFile(res);
              this.vFilesCopy = structuredClone(this.vFiles);
            }
          });
      });
    }
  }

  isProductChange() {
    let vf1 = structuredClone(this.vFiles).map((vf: VFile) => {vf.value = ''; return vf});
    let vf2 = structuredClone(this.vFilesCopy).map((vf: VFile) => {vf.value = ''; return vf});

    let change = UtilsService.isNotEqual(this.product, this.data.product) || UtilsService.isNotEqual(vf1, vf2);
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
      .pipe(UtilsService.waitLoadingSnackBarDynamicString(this.snackBar))
      .subscribe({
        next: res => {
          this.pushVFile(res);
          resolve(res);
        },
        error: err => reject(err)
      });
    })
  }

  onRemoveFile(index: number) {
    this.vFiles.splice(index, 1);
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
          const metadata = await firstValueFrom(this.s3StorageService.postFile(vFile).pipe(UtilsService.waitLoadingDialog(this.matDialog)));
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
          await firstValueFrom(this.s3StorageService.deleteFileByPath(link).pipe(UtilsService.waitLoadingDialog(this.matDialog)));
          this.product.fileLinks!.splice(i, 1);
          i--;
        }
      }
    } catch (error) {
      console.error('Error during file synchronization:', error);
      throw error;
    }
  }
  
  async save() {
    try {
      await this.syncVFiles();
  
      if (!this.product.id) {
        this.productService.post(this.product).pipe(UtilsService.waitLoadingDialog(this.matDialog)).subscribe({
          next: res => {
            this.route.navigate(['/marketing/products/', res.id]);
          },
          error: err => {
            this.data.error = 'Error saving product, please try again by refreshing the page';
            console.error('Error posting product:', err);
          }
        });
      } else {
        this.productService.put(this.product.id, this.product).pipe(UtilsService.waitLoadingDialog(this.matDialog)).subscribe({
          next: res => {
            this.data.product = res;
            this.product = structuredClone(this.data.product);
          },
          error: err => {
            this.data.error = 'Error saving product, please try again by refreshing the page';
            console.error('Error updating product:', err);
          }
        });
      }
    } catch (error) {
      this.data.error = 'Error saving product, please try again by refreshing the page';
      console.error('Error in save operation:', error);
    }
  }
}
