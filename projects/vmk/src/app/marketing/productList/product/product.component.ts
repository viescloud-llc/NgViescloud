import { AfterContentInit, AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { LoadingDialog } from 'projects/viescloud-utils/src/lib/dialog/loading-dialog/loading-dialog.component';
import { QuickSideDrawerMenu } from 'projects/viescloud-utils/src/lib/share-component/quick-side-drawer-menu/quick-side-drawer-menu.component';
import { QuickSideDrawerMenuService } from 'projects/viescloud-utils/src/lib/service/QuickSideDrawerMenu.service';
import { ProductMenuComponent } from './product-menu/product-menu.component';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss']
})
export class ProductComponent extends FixChangeDetection implements OnInit, OnDestroy {

  constructor(
    private route: ActivatedRoute,
    private matDialog: MatDialog,
    public data: ProductData,
    private sideMenuService: QuickSideDrawerMenuService
  ) { 
    super();
  }

  async ngOnInit(): Promise<void> {
    this.sideMenuService.loadComponent(ProductMenuComponent);

    let loading = UtilsService.openLoadingDialog(this.matDialog, 5000);
    this.data.error = "";
    let id = Number(this.route.snapshot.paramMap.get('id'));

    await this.data.loadCategories();
    await this.data.loadProduct(id);

    loading.close();
  }

  ngOnDestroy(): void {
    this.data.product = undefined;
  }
}
