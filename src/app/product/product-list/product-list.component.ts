import { Component, inject, OnInit, signal } from '@angular/core';
import { RxJSUtils } from '../../../lib/util/RxJS.utils';
import { ProductService } from '../../shared/service/product/product.service';
import { Product } from '../../shared/model/product.model';
import { NgComponentModule } from "../../../lib/module/ng-component.module";
import { MatAnchor } from "@angular/material/button";
import { Router } from '@angular/router';
import { APP_ROUTES } from '../../app.routes';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  imports: [NgComponentModule, MatAnchor]
})
export class ProductListComponent implements OnInit {

  protected readonly rxjsUtils = inject(RxJSUtils);
  protected readonly productService = inject(ProductService);
  protected readonly router = inject(Router);

  products = signal<Product[]>([]);
  blankProduct = new Product();

  ngOnInit(): void {
    this.productService.getAll().pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => {
        this.products.set(res);
      }
    })
  }

  addProduct() {
    this.router.navigate([APP_ROUTES.product(0)]);
  }
}
