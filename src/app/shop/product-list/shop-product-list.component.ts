import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { RxJSUtils } from '../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../lib/util/Dialog.utils';
import { Product, ProductMediaType } from '../../shared/model/product.model';
import { PublicProductsService } from '../../shared/service/public-products/public-products.service';
import { APP_ROUTES } from '../../app.routes';

// Test-shop product grid. Uses the public storefront read API (ACTIVE products
// only) — no search, no filters, just cards, per the sim's purpose.
@Component({
  selector: 'app-shop-product-list',
  templateUrl: './shop-product-list.component.html',
  styleUrls: ['./shop-product-list.component.scss'],
  imports: [MatButtonModule]
})
export class ShopProductListComponent implements OnInit {

  private rxjsUtils = inject(RxJSUtils);
  private dialogUtils = inject(DialogUtils);
  private publicProducts = inject(PublicProductsService);
  private router = inject(Router);

  products = signal<Product[]>([]);

  ngOnInit(): void {
    this.publicProducts.search({ page: 0, size: 100 }).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: res => this.products.set(res.content ?? []),
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  imageUrl(p: Product): string {
    const medias = (p.medias ?? []).filter(m => m.mediaType === ProductMediaType.IMAGE);
    const primary = medias.find(m => m.isPrimary) ?? medias[0];
    return primary?.url || '';
  }

  view(p: Product) {
    this.router.navigate([APP_ROUTES.shopProduct(p.id)]);
  }

  goToCart() {
    this.router.navigate([APP_ROUTES.shopCart]);
  }
}
