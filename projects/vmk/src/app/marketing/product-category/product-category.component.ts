import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from 'projects/viescloud-utils/src/lib/dialog/confirm-dialog/confirm-dialog.component';
import { ObjectDialogData, ObjectDialog } from 'projects/viescloud-utils/src/lib/dialog/object-dialog/object-dialog.component';
import { Category } from 'projects/viescloud-utils/src/lib/model/affiliate-marketing.model';
import { ProductCategoryService } from 'projects/viescloud-utils/src/lib/service/affiliateMarketing.service';

@Component({
  selector: 'app-product-category',
  templateUrl: './product-category.component.html',
  styleUrls: ['./product-category.component.scss']
})
export class ProductCategoryComponent implements OnInit {

  categories: Category[] = [];
  categorySample = new Category();

  constructor(
    private categoryService: ProductCategoryService,
    private matDialog: MatDialog
    ) { }

  ngOnInit() {
    this.categoryService.getAll().subscribe(
      res => {
        this.categories = res
      }
    ); 
  }

  addCategory() {
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
        this.ngOnInit();
      },
      error => {
        let dialog = this.matDialog.open(ConfirmDialog, {data: {title: 'Error creating category', message: 'Category already exist', no: '', yes: 'ok'}})
      }
    ); 
  } 

  editCategory(category: Category) {
    let matDialogData: ObjectDialogData<Category, ProductCategoryService> = {
      id: category.id,
      service: this.categoryService,
      title: 'Edit Dialog',
      getFn: (s, i) => {
        return category;
      },
      modifyFn: (s, v) => {
        return new Promise<Category>((resolve, reject) => {
          s.patch(v.id, v).subscribe(
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
        this.ngOnInit();
      },
      error => {
        let dialog = this.matDialog.open(ConfirmDialog, {data: {title: 'Error updating category', message: 'Category already exist', no: '', yes: 'ok'}})
      }
    );  
  }
}
