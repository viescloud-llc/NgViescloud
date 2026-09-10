import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RxJSUtils } from '../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../lib/util/Dialog.utils';
import { Product, ProductMediaType, ProductVariant, VariantFulfillmentType } from '../../shared/model/product.model';
import { PublicProductsService } from '../../shared/service/public-products/public-products.service';
import { ShopSessionService } from '../shop-session.service';
import { APP_ROUTES } from '../../app.routes';

// Test-shop product page: image, description, variant dropdown, quantity,
// add-to-cart. The unit price snapshotted into the cart is the variant's
// server-resolved effectivePrice (falling back to raw price, then the
// product's basePrice for products without variants... except carts need a
// variant id, so variant-less products simply can't be bought — that mirrors
// the real storefront contract).
@Component({
  selector: 'app-shop-product',
  templateUrl: './shop-product.component.html',
  styleUrls: ['./shop-product.component.scss'],
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule]
})
export class ShopProductComponent implements OnInit {

  private rxjsUtils = inject(RxJSUtils);
  private dialogUtils = inject(DialogUtils);
  private publicProducts = inject(PublicProductsService);
  private shopSession = inject(ShopSessionService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);

  product = signal<Product | null>(null);
  selectedVariant = signal<ProductVariant | null>(null);
  quantity = signal<number>(1);

  variants = computed<ProductVariant[]>(() => this.product()?.variants ?? []);

  unitPrice = computed<string>(() => {
    const v = this.selectedVariant();
    if (v) return v.effectivePrice || v.price || this.product()?.basePrice || '0';
    return this.product()?.basePrice || '0';
  });

  selectedIsDigital = computed<boolean>(() =>
    this.selectedVariant()?.fulfillmentType === VariantFulfillmentType.DIGITAL
  );

  canAdd = computed<boolean>(() =>
    !!this.selectedVariant()?.id && this.quantity() > 0
  );

  imageUrl = computed<string>(() => {
    const p = this.product();
    if (!p) return '';
    const medias = (p.medias ?? []).filter(m => m.mediaType === ProductMediaType.IMAGE);
    const primary = medias.find(m => m.isPrimary) ?? medias[0];
    return primary?.url || '';
  });

  ngOnInit(): void {
    const id = this.activatedRoute.snapshot.paramMap.get('productId');
    if (!id) return;
    this.publicProducts.getById(id).pipe(this.rxjsUtils.waitLoadingDialog()).subscribe({
      next: p => {
        this.product.set(p);
        // Preselect the first variant so a plain "Add to cart" click works.
        this.selectedVariant.set(p.variants?.[0] ?? null);
      },
      error: err => this.dialogUtils.openErrorMessageFromError(err)
    });
  }

  variantLabel(v: ProductVariant): string {
    const price = v.effectivePrice || v.price || '?';
    return `${v.variantName || v.sku} — ${price} ${this.product()?.currency ?? ''}`;
  }

  async addToCart() {
    const v = this.selectedVariant();
    if (!v?.id) return;
    try {
      await this.shopSession.addToCart(v.id, this.quantity(), this.unitPrice());
      const goToCart = await this.dialogUtils.openConfirmDialog(
        'Added to cart',
        `${this.quantity()} × ${v.variantName || v.sku} added.`,
        'Go to cart',
        'Keep shopping'
      ).catch(() => false);
      if (goToCart) this.router.navigate([APP_ROUTES.shopCart]);
    } catch (err) {
      this.dialogUtils.openErrorMessageFromError(err);
    }
  }

  backToProducts() {
    this.router.navigate([APP_ROUTES.shopProducts]);
  }
}
