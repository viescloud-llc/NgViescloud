import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from 'projects/viescloud-utils/src/lib/dialog/confirm-dialog/confirm-dialog.component';
import { ObjectDialogData, ObjectDialog } from 'projects/viescloud-utils/src/lib/dialog/object-dialog/object-dialog.component';
import { Product, Category, FileLink } from 'projects/viescloud-utils/src/lib/model/AffiliateMarketing.model';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/Mat.model';
import { ProductService, ProductCategoryService } from 'projects/viescloud-utils/src/lib/service/affiliateMarketing.service';
import { SmbService } from 'projects/viescloud-utils/src/lib/service/smb.service';
import { VFile, UtilsService } from 'projects/viescloud-utils/src/lib/service/utils.service';
import { DataUtils } from 'projects/viescloud-utils/src/lib/util/Data.utils';
import { firstValueFrom } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ProductData {

  error = '';

  //data
  product?: Product;
  categories: Category[] = [];
  productCategoriesOptions: MatOption<Category>[] = [];

  //menu
  isEditingComponent: 'overall' | 'basic' | 'pinterest' | '' = '';

  constructor(
    private matDialog: MatDialog,
    private productService: ProductService,
    private categoryService: ProductCategoryService
  ) { }

  async loadProduct(id: number) {
    return new Promise<void>((resolve, reject) => {
      if (id <= 0) {
        this.loadNewProduct();
        resolve();
      }
      else {
        this.productService.get(id).pipe(UtilsService.waitLoadingDialog(this.matDialog)).subscribe({
          next: res => {
            this.product = res;
          },
          error: err => {
            if (err.status === 404)
              this.error = 'Product not found';
            else if (err.status === 403)
              this.error = 'You don\'t have permission to access this product';
  
            else
              this.error = 'Error loading product';
          },
          complete: () => resolve()
        });
      }
    })
  }

  private loadNewProduct() {
    this.product = DataUtils.purgeArray(new Product());
    this.product.fileLinks = [];
    this.product.pinterestPinData = undefined;
  }

  async loadCategories() {
    return new Promise<void>((resolve, reject) => {
      this.categoryService.getAll().pipe(UtilsService.waitLoadingDialog(this.matDialog)).subscribe({
        next: res => {
          this.categories = res;
          this.productCategoriesOptions = [];
          this.categories.forEach(category => {
            let option: MatOption<any> = {
              value: category,
              valueLabel: category.name
            }

            this.productCategoriesOptions.push(option);
          });
        },
        error: err => {
          this.error = 'Error loading categories, please try again by refreshing the page';
        },
        complete: () => resolve()
      })
    })
  }

  addNewCategory() {
    let category = new Category();
    let matDialogData: ObjectDialogData<Category, ProductCategoryService> = {
      id: 0,
      service: this.categoryService,
      title: 'Create new Dialog',
      getFn: (s, i) => {
        return category;
      },
      createFn: (s, v) => {
        return new Promise<Category>((resolve, reject) => {
          s.post(v).subscribe(
            res => {
              resolve(res);
            },
            error => {
              reject(error);
            })
        });
      },
      blankObject: new Category()
    }

    let dialog = this.matDialog.open(ObjectDialog, {data: matDialogData});

    dialog.afterClosed().subscribe(
      res => {
        this.loadCategories();
      },
      error => {
        let dialog = this.matDialog.open(ConfirmDialog, {data: {title: 'Error creating category', message: 'Category already exist', no: '', yes: 'ok'}})
      }
    ); 
  } 
}
