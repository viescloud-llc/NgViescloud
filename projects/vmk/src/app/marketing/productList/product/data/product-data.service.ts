import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from 'projects/viescloud-utils/src/lib/dialog/confirm-dialog/confirm-dialog.component';
import { ObjectDialogData, ObjectDialog } from 'projects/viescloud-utils/src/lib/dialog/object-dialog/object-dialog.component';
import { Product, Category, FileLink } from 'projects/viescloud-utils/src/lib/model/AffiliateMarketing.model';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/Mat.model';
import { ProductService, ProductCategoryService } from 'projects/viescloud-utils/src/lib/service/AffiliateMarketing.service';
import { SmbService } from 'projects/viescloud-utils/src/lib/service/Smb.service';
import { VFile, UtilsService } from 'projects/viescloud-utils/src/lib/service/Utils.service';
import { firstValueFrom } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ProductData {

  //error
  error = '';
  uploadError = '';

  //data
  product!: Product;
  categories: Category[] = [];
  productCategoriesOptions: MatOption<Category>[] = [];
  files: VFile[] = [];

  //input
  inputUri = '';
  selectedResolution: '1080p' | '720p' | '480p' | '360p' | 'original' = '480p';

  onAddFileSubscribers: {afterAdd: (file: VFile, fileLink: FileLink) => void}[] = [];

  constructor(
    private utilsService: UtilsService,
    private matDialog: MatDialog,
    private productService: ProductService,
    private categoryService: ProductCategoryService,
    private smbService: SmbService,
  ) { }

  async populateAllFile(selectedResolution: '1080p' | '720p' | '480p' | '360p' | 'original') {
    for(let file of this.files) {
      if(file.rawFile) {
        if(file.extension === 'mp4' || file.extension === 'webm') {
            file.value = window.URL.createObjectURL(file.rawFile);
        }
        else {
          if(selectedResolution !== 'original')
            file.value = await UtilsService.resizeImage(file.rawFile, selectedResolution);
          else
            file.value = window.URL.createObjectURL(file.rawFile);
        }
      }
    }
  }

  async fetchFile(uri: string) {
    return new Promise<void>((resolve, reject) => {
      UtilsService.fetchMedia(uri).then(file => {
        if(file.type.toLowerCase() === 'mp4' || file.type === 'webm' || file.type === 'jpg' || file.type === 'png' || file.type === 'jpeg') {
          let newFileName = UtilsService.makeId(20) + '.' + file.extension;
          let fileLink: FileLink = {
            id: 0,
            link: newFileName,
            mediaType: file.type,
            external: false
          }
          this.addNewFile(file, fileLink);
          resolve();
        }  
        else {
          this.uploadError = 'File type not supported';
          reject();
        }
      }).catch(err => {
        this.uploadError = err;
        reject();
      });
    })
  }

  async uploadFile() {
    return new Promise<void>((resolve, reject) => {
      this.utilsService.uploadFile("image/jpeg, image/png, video/mp4, video/webm").then(file => {
        if(file) {
          if(file.extension === 'mp4' || file.extension === 'webm' || file.extension === 'jpg' || file.extension === 'png' || file.extension === 'jpeg') {
            let newFileName = UtilsService.makeId(20) + '.' + file.extension;
            let fileLink: FileLink = {
              id: 0,
              link: newFileName,
              mediaType: file.type,
              external: false
            }
            file.name = newFileName;
            this.addNewFile(file, fileLink);
            resolve();
          }
        }
        else
          reject();
      })
    })
  }

  addNewFile(file: VFile, fileLink: FileLink, internalCall: boolean = false) {
    this.files.push(file);
    this.populateAllFile(this.selectedResolution);

    if(!internalCall)
      this.onAddFileSubscribers.forEach(s => s.afterAdd(file, fileLink));
  }

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
    this.product = new Product();
    this.product.fileLinks = [];
    this.product.pinterestPinData = undefined;
  }

  async syncFileLinks() {
    return new Promise<void>(async (resolve, reject) => {
      this.files = [];
      if(this.product.fileLinks && this.product.fileLinks.length > 0) {
        for(let fileLink of this.product.fileLinks) {
          if(!fileLink.link) {
            let vFile = {
              name: 'error loading file',
              type: '',
              value: '',
              extension: '',
            }
            this.addNewFile(vFile, fileLink, true);
          }
          else if(!fileLink.external) {
            let blob = await firstValueFrom(this.smbService.getFileByPath(this.smbService.extractPathFromViesLink(fileLink.link)).pipe(UtilsService.waitLoadingDialog(this.matDialog)));
            let vFile: VFile = {
              name: fileLink.link,
              type: fileLink.mediaType,
              value: '',
              extension: this.smbService.extractExtensionFromViesLink(fileLink.link),
              rawFile: blob
            }
            this.addNewFile(vFile, fileLink, true);
          }
          else {
            await this.fetchFile(fileLink.link);
          }
        }
      }

      resolve();
    })
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
