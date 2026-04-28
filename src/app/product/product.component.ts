import { Component, inject, OnInit, signal } from '@angular/core';
import { RxJSUtils } from '../../lib/util/RxJS.utils';
import { ProductService } from '../shared/service/product/product.service';
import { RouteUtils } from '../../lib/util/Route.utils';
import { Product } from '../shared/model/product.model';
import { DialogUtils } from '../../lib/util/Dialog.utils';
import { NgComponentModule } from "../../lib/module/ng-component.module";
import { ProductMediaListComponent } from "./product-media-list/product-media-list.component";
import { DataUtils } from '../../lib/util/Data.utils';
import { ViesMatFormFieldMap } from '../../lib/abtract/ViesMatFormFieldMap';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss'],
  imports: [NgComponentModule, ProductMediaListComponent]
})
export class ProductComponent extends ViesMatFormFieldMap implements OnInit {

  protected readonly rxjsUtils = inject(RxJSUtils);
  protected readonly dialogUtils = inject(DialogUtils);
  protected readonly productService = inject(ProductService);

  product = signal<Product>(DataUtils.purgeValue(new Product()));
  readonly blankProduct = new Product();

  id = 0;

  ngOnInit(): void {
    this.id = RouteUtils.getPathVariableAsInteger("product") ?? 0;

    // 0 mean new product
    if(this.id !== 0) {
      this.productService.get(this.id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
        next: res => {
          this.product.set(res);
        },
        error: err => {
          this.dialogUtils.openErrorMessageFromError(err);
        }
      })
    }
  }

  printProduct(product?: Product) {
    if(product) {
      console.log(product);
    }
    else {
      console.log(this.product());
    }
  }
}
