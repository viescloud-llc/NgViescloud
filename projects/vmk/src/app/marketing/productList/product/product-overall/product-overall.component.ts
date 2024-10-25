import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ProductData } from '../data/product-data.service';
import { ProductBasicComponent } from '../product-basic/product-basic.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ProductService } from 'projects/viescloud-utils/src/lib/service/AffiliateMarketing.service';
import { SmbService } from 'projects/viescloud-utils/src/lib/service/Smb.service';
import { PinResponse } from 'projects/viescloud-utils/src/lib/model/AffiliateMarketing.model';
import { QuickSideDrawerMenuService } from 'projects/viescloud-utils/src/lib/service/QuickSideDrawerMenu.service';
import { S3StorageServiceV1 } from 'projects/viescloud-utils/src/lib/service/ObjectStorageManager.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-product-overall',
  templateUrl: './product-overall.component.html',
  styleUrls: ['./product-overall.component.scss']
})
export class ProductOverallComponent extends ProductBasicComponent {

  private PINTEREST_PIN_LINK = 'https://www.pinterest.com/pin/'

  blankPinResponse: PinResponse = new PinResponse();

  override ngOnChanges(changes: SimpleChanges): void {
      
  }

  isThereAreData() {
    return this.product.pinterestPinData && this.product.pinterestPinData.pinResponse;
  }

  override setEditingComponent(): void {
    this.data.isEditingComponent = 'overall';
  }

  getPinterestLink(id: string) {
    return this.PINTEREST_PIN_LINK + id;
  }

  openPinterestPinLink(id: string) {
    window.open(this.getPinterestLink(id), '_blank');
  }

}
