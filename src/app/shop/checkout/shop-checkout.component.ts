import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../lib/util/Dialog.utils';
import { DataUtils } from '../../../lib/util/Data.utils';
import { Address, AddressType } from '../../shared/model/address.model';
import { Cart } from '../../shared/model/commerce.model';
import { CheckoutResponse } from '../../shared/model/checkout.model';
import { CheckoutOrchestratorService } from '../../shared/service/checkout-orchestrator/checkout-orchestrator.service';
import { ShopSessionService } from '../shop-session.service';
import { APP_ROUTES } from '../../app.routes';

// Test-shop checkout. One address form used for BOTH shipping and billing
// (fine for a sim), optional discount code, provider hardcoded to 'paypal'.
//
// Flow: Place order → POST /orders/checkout (creates the fulfillment +
// checkout order, deactivates the cart) → panel shows:
//   • "Approve on PayPal" — opens approveUrl in a new tab (sandbox login).
//   • "Complete order" — POST /orders/{id}/complete AFTER approving; captures
//     payment, decrements stock, flips fulfillment to PROCESSING.
// Completing before approving will fail server-side — the error dialog shows
// whatever PayPal/the orchestrator complains about, which is exactly what
// this sim exists to exercise.
@Component({
  selector: 'app-shop-checkout',
  templateUrl: './shop-checkout.component.html',
  styleUrls: ['./shop-checkout.component.scss'],
  imports: [NgComponentModule, MatButtonModule]
})
export class ShopCheckoutComponent extends ViesMatFormFieldMap implements OnInit {

  private rxjsUtils = inject(RxJSUtils);
  private dialogUtils = inject(DialogUtils);
  private shopSession = inject(ShopSessionService);
  private checkoutService = inject(CheckoutOrchestratorService);
  private router = inject(Router);

  cart = signal<Cart | null>(null);
  address = signal<Address>(DataUtils.purgeValue(new Address()));
  readonly blankAddress = new Address();
  discountCode = signal<string>('');
  validForm = signal<boolean>(false);

  // Set once checkout succeeds; switches the page from form-mode to
  // approve/complete-mode.
  checkoutResult = signal<CheckoutResponse | null>(null);
  completing = signal<boolean>(false);

  canPlaceOrder = computed<boolean>(() =>
    !!this.cart()?.id && (this.cart()?.items?.length ?? 0) > 0
  );

  ngOnInit(): void {
    this.shopSession.getActiveCart()
      .then(c => this.cart.set(c))
      .catch(err => this.dialogUtils.openErrorMessageFromError(err));
  }

  onAddressChange(a: Address) {
    this.address.set({ ...a });
  }

  cartTotal = computed<string>(() =>
    (this.cart()?.items ?? [])
      .reduce((sum, i) => sum + Number(i.priceAtTime || 0) * (i.quantity || 0), 0)
      .toFixed(2)
  );

  async placeOrder() {
    const cart = this.cart();
    if (!cart?.id) return;

    const shipping: Address = { ...this.address(), type: AddressType.SHIPPING };
    const billing: Address = { ...this.address(), type: AddressType.BILLING };
    const origin = window.location.origin;

    try {
      const result = await firstValueFrom(
        this.checkoutService.checkout({
          cartId: cart.id,
          shippingAddress: shipping,
          billingAddress: billing,
          discountCode: this.discountCode().trim() || undefined,
          provider: 'paypal',
          returnUrl: `${origin}/${APP_ROUTES.shopOrders}`,
          cancelUrl: `${origin}/${APP_ROUTES.shopCart}`
        }).pipe(this.rxjsUtils.waitLoadingDialog())
      );
      this.checkoutResult.set(result);
    } catch (err) {
      this.dialogUtils.openErrorMessageFromError(err);
    }
  }

  openApproveUrl() {
    const url = this.checkoutResult()?.approveUrl;
    if (url) window.open(url, '_blank');
  }

  async completeOrder() {
    const orderId = this.checkoutResult()?.orderFulfillment?.id;
    if (!orderId) return;
    this.completing.set(true);
    try {
      await firstValueFrom(
        this.checkoutService.complete(orderId).pipe(this.rxjsUtils.waitLoadingDialog())
      );
      this.router.navigate([APP_ROUTES.shopOrder(orderId)]);
    } catch (err) {
      this.dialogUtils.openErrorMessageFromError(err);
    } finally {
      this.completing.set(false);
    }
  }

  viewOrder() {
    const orderId = this.checkoutResult()?.orderFulfillment?.id;
    if (orderId) this.router.navigate([APP_ROUTES.shopOrder(orderId)]);
  }

  backToCart() {
    this.router.navigate([APP_ROUTES.shopCart]);
  }
}
