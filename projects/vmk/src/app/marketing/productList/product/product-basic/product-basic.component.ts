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

@Component({
  selector: 'app-product-basic',
  templateUrl: './product-basic.component.html',
  styleUrls: ['./product-basic.component.scss']
})
export class ProductBasicComponent implements OnInit, OnChanges {

  @Input()
  selectedTabIndex = 0;

  @Output()
  selectedTabIndexChange = new EventEmitter<number>();

  product!: Product;

  currentTabIndex = 1;

  //blank object
  blankProduct = new Product();
  blankFileLink: FileLink = new FileLink();
  blankPinRequest = new PinRequest()

  //input
  selectedFileIndex = 0;
  swapFileIndexInput = 0;
  validInput = false;

  constructor(
    protected matDialog: MatDialog,
    protected productService: ProductService,
    protected smbService: SmbService,
    protected route: Router,
    protected data: ProductData,
    protected sideMenuService: QuickSideDrawerMenuService
  ) { 
    data.onAddFileSubscribers.push({
      afterAdd: (f, fl) => {
        this.afterAddFile(f, fl);
      }
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(this.selectedTabIndex != this.currentTabIndex && this.product && this.isProductChange()) {
      let dialog = this.matDialog.open(ConfirmDialog, {
        data: {
          title: `You have unsaved changes`,
          message: 'you have unsaved changes. Do you want to discard/undo them?',
          yes: 'Yes',
          no: 'No'
        }
      })

      dialog.afterClosed().subscribe({
        next: res => {
          if(res) {
            this.reverse();
          }
          else
            this.selectedTabIndexChange.emit(this.currentTabIndex);
        }
      })
    }
  }

  ngOnInit() {
    this.product = structuredClone(this.data.product);
    if(!this.product.id) {
      this.product.pinterestPinData = undefined;
    }

    this.sideMenuService.loadComponent(ProductMenuComponent);
  }

  isProductChange() {
    return !UtilsService.isEqual(this.data.product, this.product);
  }

  afterAddFile(vFile: VFile, fileLink: FileLink) {
    if(this.selectedTabIndex == this.currentTabIndex) {
      if(!this.product.fileLinks)
        this.product.fileLinks = [];
      this.product.fileLinks.push(fileLink);
      this.selectedFileIndex = this.data.files.length - 1;
    }
  }

  afterRemoveFile(index: number) {
    this.data.files.splice(index, 1);
    this.product.fileLinks!.splice(index, 1);
  }

  reverse() {
    this.ngOnInit();
    this.data.syncFileLinks();
  }

  async save() {
    for (const [index, fileLink] of this.product.fileLinks!.entries()) {
      if (!fileLink.external && !this.smbService.containViesLink(fileLink.link)) {
        const file = this.data.files[index];
        try {
          const metadata = await firstValueFrom(
            this.smbService.postFile(file).pipe(UtilsService.waitLoadingDialog(this.matDialog))
          );
          fileLink.link = this.smbService.generateViesLinkFromPath(metadata.path);
        } catch (error: any) {
          window.alert('Error uploading file: ' + error.error.reason);
          return;
        }
      }
    }

    if(!this.product.id) {
      this.productService.post(this.product).pipe(UtilsService.waitLoadingDialog(this.matDialog)).subscribe({
        next: res => {
          this.route.navigate(['/marketing/products/', res.id]);
        },
        error: err => {
          this.data.error = 'Error saving product, please try again by refreshing the page';
        }
      });
    }
    else {
      this.productService.put(this.product.id, this.product).pipe(UtilsService.waitLoadingDialog(this.matDialog)).subscribe({
        next: res => {
          this.product = res;
          this.data.product = structuredClone(res);
        },
        error: err => {
          this.data.error = 'Error saving product, please try again by refreshing the page';
        }
      });
    }
  }
}
