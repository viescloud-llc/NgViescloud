import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { AuthGuard } from '../lib/guards/auth.guard';
import { MaintenancePageComponent } from '../lib/share-component/maintenance-page/maintenance-page.component';
import { ApplicationSettingComponent } from '../lib/share-component/application-setting/application-setting.component';
import { LoginComponent } from '../lib/share-component/login/login.component';
import { UserSettingComponent } from '../lib/share-component/user-setting/user-setting.component';
import { maintenanceGuard } from './shop/maintenance.guard';

// Customer-facing storefront (venzora-customer). The back office lives in the
// venzora-manager project; this app only talks to the public and user-scoped
// endpoints (storefront, public products, the signed-in buyer's carts, orders,
// returns and downloads).
//
//   /                   storefront home (resolved storefront + active template)
//   /pages/:slug        a published content page (about, policies, …)
//   /products[/:id]     catalogue (public)
//   /cart /checkout     the buyer's cart and checkout (login required)
//   /orders[/:id]       the buyer's own orders, downloads, shipments (login required)
//   /login /oauth2      sign in; /setting/account — profile
//   /maintenance        where customers wait while the backend is in maintenance
export const APP_ROUTES = {
  home: "home",
  login: "login",
  setting: "setting",
  applicationSetting: "setting/application-setting",
  accountSetting: "setting/account",
  oauth2: "oauth2",
  maintenancePage: "maintenance",

  // ---- Shop -----------------------------------------------------------------
  shopHome: "home",
  shopPage(slug: string) {
    return `pages/${slug}`;
  },
  shopProducts: "products",
  shopProduct(id: string) {
    return `products/${id}`;
  },
  shopCart: "cart",
  shopCheckout: "checkout",
  shopOrders: "orders",
  shopOrder(id: string) {
    return `orders/${id}`;
  }
};

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    // Public browsing: storefront, content pages, catalogue.
    path: '',
    canActivate: [maintenanceGuard],
    children: [
      {
        path: "home",
        loadComponent: () => import('./shop/home/shop-home.component').then(m => m.ShopHomeComponent)
      },
      {
        path: "pages/:slug",
        loadComponent: () => import('./shop/page/shop-page.component').then(m => m.ShopPageComponent)
      },
      {
        path: "products",
        loadComponent: () => import('./shop/product-list/shop-product-list.component').then(m => m.ShopProductListComponent)
      },
      {
        path: "products/:productId",
        loadComponent: () => import('./shop/product/shop-product.component').then(m => m.ShopProductComponent)
      }
    ]
  },
  {
    // Buyer-only: carts and orders are user-scoped server-side.
    path: '',
    canActivate: [async () => inject(AuthGuard).isLogin(), maintenanceGuard],
    children: [
      {
        path: "cart",
        loadComponent: () => import('./shop/cart/shop-cart.component').then(m => m.ShopCartComponent)
      },
      {
        path: "checkout",
        loadComponent: () => import('./shop/checkout/shop-checkout.component').then(m => m.ShopCheckoutComponent)
      },
      {
        path: "orders",
        loadComponent: () => import('./shop/order-list/shop-order-list.component').then(m => m.ShopOrderListComponent)
      },
      {
        path: "orders/:orderId",
        loadComponent: () => import('./shop/order/shop-order.component').then(m => m.ShopOrderComponent)
      }
    ]
  },
  {
    path: "login",
    component: LoginComponent
  },
  {
    path: 'oauth2',
    component: LoginComponent
  },
  {
    // Where customers land while the backend is in maintenance (lib page; public).
    path: "maintenance",
    component: MaintenancePageComponent
  },
  {
    path: 'setting',
    children: [
      {
        path: 'application-setting',
        component: ApplicationSettingComponent
      },
      {
        path: 'account',
        component: UserSettingComponent,
        canActivate: [async () => inject(AuthGuard).isLogin()]
      }
    ]
  },
  {
    path: "**",
    redirectTo: "home"
  }
];
