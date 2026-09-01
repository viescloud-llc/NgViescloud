import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DataUtils } from '../../lib/util/Data.utils';
import { Cart, CartItem } from '../shared/model/commerce.model';
import { ProductVariant } from '../shared/model/product.model';
import { CartService } from '../shared/service/cart/cart.service';

// Cart mechanics shared by the test-shop pages. Carts are user-scoped
// server-side, so "my cart" is just the active one in getAll(). Items are
// owned with orphanRemoval — always PUT the full items array.
//
// Test-harness quality on purpose: no caching, no optimistic UI, no
// concurrency handling. Every call round-trips.
@Injectable({
  providedIn: 'root'
})
export class ShopSessionService {

  private cartService = inject(CartService);

  // The user's active cart, or null if they don't have one yet.
  async getActiveCart(): Promise<Cart | null> {
    const carts = await firstValueFrom(this.cartService.getAll());
    return carts.find(c => c.active) ?? null;
  }

  // Active cart, creating an empty one on first use.
  async getOrCreateActiveCart(): Promise<Cart> {
    const existing = await this.getActiveCart();
    if (existing) return existing;

    const blank = DataUtils.purgeValue(new Cart());
    blank.active = true;
    blank.totalPrice = '0';
    blank.items = [];
    return firstValueFrom(this.cartService.post(blank));
  }

  // Append (or bump the quantity of) a variant, recompute the total, PUT.
  async addToCart(variantId: string, quantity: number, unitPrice: string): Promise<Cart> {
    const cart = await this.getOrCreateActiveCart();
    if (!Array.isArray(cart.items)) cart.items = [];

    const existing = cart.items.find(i => i.productVariant?.id === variantId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      const item = DataUtils.purgeValue(new CartItem());
      item.productVariant = { id: variantId } as ProductVariant;
      item.quantity = quantity;
      item.priceAtTime = unitPrice;
      cart.items.push(item);
    }
    return this.saveCart(cart);
  }

  // Recompute the denormalized total and PUT the full cart graph. Items carry
  // no back-refs (parent is implicit from nesting per the backend schema).
  async saveCart(cart: Cart): Promise<Cart> {
    cart.totalPrice = (cart.items ?? [])
      .reduce((sum, i) => sum + Number(i.priceAtTime || 0) * (i.quantity || 0), 0)
      .toFixed(2);
    return firstValueFrom(this.cartService.put(cart.id, cart));
  }
}
