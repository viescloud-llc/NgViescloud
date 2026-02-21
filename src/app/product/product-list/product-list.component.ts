import { Component, signal } from '@angular/core';
import { RxJSUtils } from '../../../lib/util/RxJS.utils';
import { ProductService } from '../../shared/service/product/product.service';
import { Product } from '../../shared/model/product.model';
import { NgComponentModule } from "../../../lib/module/ng-component.module";

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  imports: [NgComponentModule]
})
export class ProductListComponent {

  products = signal<Product[]>([]);
  blankProduct = new Product();

  constructor(
    private rxjsUtils: RxJSUtils,
    private productService: ProductService
  ) { }

  ngOnInit(): void {
    this.productService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.products.set(res);
      }
    })
  }
}
