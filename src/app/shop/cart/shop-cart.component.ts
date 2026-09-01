import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { DialogUtils } from '../../../lib/util/Dialog.utils';
import { RxJSUtils } from '../../../lib/util/RxJS.utils';
import { Cart, CartItem } from '../../shared/model/commerce.model';
import { ShopSessionService } from '../shop-session.service';
import { APP_ROUTES } from '../../app.routes';

// Test-shop cart: line items with editable quantity, remove, running total,
// and a Checkout button. Every mutation PUTs the whole cart (items are owned
// with orphanRemoval server-side).
@Component({
  selector: 'app-shop-cart',
  templateUrl: './shop-cart.component.html',
  styleUrls: ['./shop-cart.component.scss'],
  imports: [FormsModule, MatButtonModule]
})
export class ShopCartComponent implements OnInit {

  private rxjsUtils = inject(RxJSUtils);
  private dialogUtils = inject(DialogUtils);
  private shopSession = inject(ShopSessionService);
  private router = inject(Router);

  cart = signal<Cart | null>(null);
  loading = signal<boolean>(true);

  items = computed<CartItem[]>(() => this.cart()?.items ?? []);
  isEmpty = computed<boolean>(() => this.items().length === 0);

  total = computed<string>(() =>
    this.items()
      .reduce((sum, i) => sum + Number(i.priceAtTime || 0) * (i.quantity || 0), 0)
      .toFixed(2)
  );

  ngOnInit(): void {
    this.refresh();
  }

  private async refresh() {
    this.loading.set(true);
    try {
      this.cart.set(await this.shopSession.getActiveCart());
    } catch (err) {
      this.dialogUtils.openErrorMessageFromError(err);
    } finally {
      this.loading.set(false);
    }
  }

  itemLabel(item: CartItem): string {
    const v = item.productVariant;
    return v?.variantName || v?.sku || v?.id || '(unknown variant)';
  }

  lineTotal(item: CartItem): string {
    return (Number(item.priceAtTime || 0) * (item.quantity || 0)).toFixed(2);
  }

  async changeQuantity(item: CartItem, qty: number) {
    const cart = this.cart();
    if (!cart) return;
    item.quantity = Math.max(1, Number(qty) || 1);
    await this.persist(cart);
  }

  async removeItem(item: CartItem) {
    const cart = this.cart();
    if (!cart?.items) return;
    cart.items = cart.items.filter(i => i !== item);
    await this.persist(cart);
  }

  private async persist(cart: Cart) {
    try {
      this.cart.set(await this.shopSession.saveCart(cart));
    } catch (err) {
      this.dialogUtils.openErrorMessageFromError(err);
      this.refresh();
    }
  }

  checkout() {
    this.router.navigate([APP_ROUTES.shopCheckout]);
  }

  keepShopping() {
    this.router.navigate([APP_ROUTES.shopProducts]);
  }
}
