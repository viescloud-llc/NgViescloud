import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Product } from 'projects/viescloud-utils/src/lib/model/AffiliateMarketing.model';
import { ProductService } from 'projects/viescloud-utils/src/lib/service/affiliateMarketing.service';
import { UtilsService } from 'projects/viescloud-utils/src/lib/service/utils.service';

@Component({
  selector: 'app-productList',
  templateUrl: './productList.component.html',
  styleUrls: ['./productList.component.scss']
})
export class ProductListComponent implements OnInit {

  products: Product[] = [];
  productSample: Product = new Product();

  constructor(
    private productService: ProductService,
    private dialog: MatDialog,
    private router: Router
    ) { }
  
  ngOnInit() {
    this.productService.getAll().pipe(UtilsService.waitLoadingDialog(this.dialog)).subscribe(
      res => {
        this.products = res;
      }
    );
  }

  editProduct(product: Product) {
    this.router.navigate(['/marketing/products', product.id]);
  }
}
