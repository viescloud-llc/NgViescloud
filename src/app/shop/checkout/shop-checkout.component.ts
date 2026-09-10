import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { NgComponentModule } from '../../../lib/module/ng-component.module';
import { ViesMatFormFieldMap } from '../../../lib/abtract/ViesMatFormFieldMap';
import { RxJSUtils } from '../../../lib/util/RxJS.utils';
import { DialogUtils } from '../../../lib/util/Dialog.utils';
import { DataUtils } from '../../../lib/util/Data.utils';
import { Address, AddressType } from '../../shared/model/address.model';
import { Cart, ShippingQuote } from '../../shared/model/commerce.model';
import { VariantFulfillmentType } from '../../shared/model/product.model';
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
  imports: [NgComponentModule, MatButtonModule, MatRadioModule]
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

  // ---- Shipping options (POST /orders/shipping-quote) --------------------------
  //
  // Priced against the typed address; the recommended method is preselected,
  // the buyer may pick another. Digital-only carts skip the step. Placing the
  // order sends the chosen rule id; the server re-quotes and refuses a method
  // that no longer applies.
  shippingQuote = signal<ShippingQuote | null>(null);
  selectedShippingRuleId = signal<string>('');
  quoting = signal<boolean>(false);

  isDigitalOnly = computed<boolean>(() => {
    const items = this.cart()?.items ?? [];
    return items.length > 0 && items.every(i => i.productVariant?.fulfillmentType === VariantFulfillmentType.DIGITAL);
  });
  availableShipping = computed(() => (this.shippingQuote()?.options ?? []).filter(o => o.available));
  selectedShipping = computed(() => this.availableShipping().find(o => o.ruleId === this.selectedShippingRuleId()) ?? null);
  shippingCostPreview = computed<string>(() => {
    const q = this.shippingQuote();
    if (this.isDigitalOnly() || q?.bootstrapFree) return '0.00';
    const s = this.selectedShipping();
    return s ? Number(s.amount ?? 0).toFixed(2) : '—';
  });
  canQuoteShipping = computed<boolean>(() => !!this.cart()?.id && !this.isDigitalOnly() && !!this.address().country.trim() && !this.quoting());

  canPlaceOrder = computed<boolean>(() => {
    if (!this.cart()?.id || (this.cart()?.items?.length ?? 0) === 0) return false;
    if (this.isDigitalOnly()) return true;
    const q = this.shippingQuote();
    return !!q && (q.bootstrapFree || !!this.selectedShipping());
  });

  async fetchShippingOptions() {
    const cart = this.cart();
    if (!cart?.id || !this.canQuoteShipping()) return;
    this.quoting.set(true);
    try {
      const q = await firstValueFrom(this.checkoutService.shippingQuote({
        cartId: cart.id,
        shippingAddress: { ...this.address(), type: AddressType.SHIPPING }
      }));
      this.shippingQuote.set(q);
      const current = q.options.find(o => o.ruleId === this.selectedShippingRuleId() && o.available);
      this.selectedShippingRuleId.set(current?.ruleId ?? q.recommendedRuleId ?? '');
    } catch (err) {
      this.shippingQuote.set(null);
      this.dialogUtils.openErrorMessageFromError(err);
    } finally {
      this.quoting.set(false);
    }
  }

  eta(min?: number | null, max?: number | null): string {
    if (!min && !max) return '';
    if (min && max) return `${min}–${max} days`;
    return `${min ?? max} days`;
  }

  ngOnInit(): void {
    this.shopSession.getActiveCart()
      .then(c => this.cart.set(c))
      .catch(err => this.dialogUtils.openErrorMessageFromError(err));
  }

  onAddressChange(a: Address) {
    const countryChanged = (a.country ?? '') !== (this.address().country ?? '');
    this.address.set({ ...a });
    // A stale quote must not be sent with a new country; the buyer re-quotes.
    if (countryChanged) { this.shippingQuote.set(null); this.selectedShippingRuleId.set(''); }
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
          shippingRuleId: this.isDigitalOnly() ? undefined : (this.selectedShippingRuleId() || undefined),
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
