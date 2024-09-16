import { AfterContentInit, AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog } from 'projects/viescloud-utils/src/lib/dialog/confirm-dialog/confirm-dialog.component';
import { ObjectDialog, ObjectDialogData } from 'projects/viescloud-utils/src/lib/dialog/object-dialog/object-dialog.component';
import { FixChangeDetection } from 'projects/viescloud-utils/src/lib/directive/FixChangeDetection';
import { FileLink, Product, Category, PinRequest, PinterestPinData } from 'projects/viescloud-utils/src/lib/model/AffiliateMarketing.model';
import { MatOption } from 'projects/viescloud-utils/src/lib/model/Mat.model';
import { ProductCategoryService, ProductService } from 'projects/viescloud-utils/src/lib/service/AffiliateMarketing.service';
import { SmbService } from 'projects/viescloud-utils/src/lib/service/Smb.service';
import { VFile, UtilsService } from 'projects/viescloud-utils/src/lib/service/Utils.service';
import { ProductData } from './data/product-data.service';
import { PinterestProductComponent } from './pinterest-product/pinterest-product.component';
import { LoadingDialog } from 'projects/viescloud-utils/src/lib/dialog/loading-dialog/loading-dialog.component';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss']
})
export class ProductComponent extends FixChangeDetection implements OnInit {

  isValidBasicDataInput: boolean = false;
  isValidPinterestDataInput: boolean = false;
  selectedTabIndex: number = 0;

  constructor(
    private route: ActivatedRoute,
    private matDialog: MatDialog,
    public data: ProductData
  ) { 
    super();
  }

  async ngOnInit(): Promise<void> {
    let tab = UtilsService.getQueryParam("tab");
    if(tab) {
      switch(tab) {
        case 'basic':
          this.selectedTabIndex = 1;
          break;
        case 'pinterest':
          this.selectedTabIndex = 2;
          break;
        default:
          this.selectedTabIndex = 0;
      }
    }

    let loading = UtilsService.openLoadingDialog(this.matDialog, 5000);

    this.data.error = "";
    this.data.uploadError = "";
    let id = Number(this.route.snapshot.paramMap.get('id'));

    await this.data.loadCategories();
    await this.data.loadProduct(id);
    await this.data.syncFileLinks();

    loading.close();
  }

  isAllValidInput() {
    return this.isValidBasicDataInput && this.isValidPinterestDataInput;
  }

  changeTabIndex(num: number) {
    this.selectedTabIndex = num;

    switch(num) {
      case 0:
        UtilsService.setQueryParam("tab", "overall");
        break;
      case 2:
        UtilsService.setQueryParam("tab", "pinterest");
        break;
      default:
        UtilsService.setQueryParam("tab", "basic");
    }
  }
}
