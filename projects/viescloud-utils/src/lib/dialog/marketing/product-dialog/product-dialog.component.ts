import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { Product, Category } from '../../../model/AffiliateMarketing.model';
import { ProductCategoryService, ProductService } from '../../../service/AffiliateMarketing.service';
import { ObjectDialog, ObjectDialogData } from '../../object-dialog/object-dialog.component';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatOption } from '../../../model/Mat.model';

@Component({
  selector: 'app-product-dialog',
  templateUrl: './product-dialog.component.html',
  styleUrls: ['./product-dialog.component.scss']
})
export class ProductDialog extends ObjectDialog<Product, ProductService> {

  productCategoriesOptions: MatOption<any>[] = [];
  productCategoryBlank = new Category();

  constructor(
    @Inject(MAT_DIALOG_DATA) data: {id: number},
    dialogRef: MatDialogRef<ObjectDialog>,
    cd: ChangeDetectorRef,
    productService: ProductService,
    private productCategoryService: ProductCategoryService
  ) {
    let dialogData: ObjectDialogData<Product, ProductService> = {
      id: data.id,
      service: productService,
      blankObject: new Product(),
      getFn: async (s, i) => {
        return new Promise<Product>((resolve, reject) => {
          if(i <= 0)
            resolve(new Product());
          else
            s.get(i).subscribe(
              res => {
                resolve(res);
              },
              error => {
                reject(error);
              });
        })
      },
      createFn(service, value) {
        return new Promise<Product>((resolve, reject) => {
          service.post(value).subscribe(
            res => resolve(res),
            error => reject(error)
          );
        })
      },
      modifyFn(service, value) {
        return new Promise<Product>((resolve, reject) => {
          service.patch(this.id ,value).subscribe(
            res => resolve(res),
            error => reject(error)
          );
        })
      },
    }
    
    super(dialogData, dialogRef, cd);
  }

  override ngOnInit(): Promise<void> {
    this.productCategoryService.getAll().subscribe(
      res => {
        this.populateCategoryOption(res);
      }
    );

    return super.ngOnInit();
  }

  populateCategoryOption(category: Category[]) {
    this.productCategoriesOptions = [];
    if(category) {
      category.forEach(e => {
        let option: MatOption<any> = {
          value: e,
          valueLabel: e.name
        }
        this.productCategoriesOptions.push(option);
      })
    }
  }
}
