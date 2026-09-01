import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { AuthGuard } from '../lib/guards/auth.guard';
import { ApplicationSettingComponent } from '../lib/share-component/application-setting/application-setting.component';
import { LoginComponent } from '../lib/share-component/login/login.component';
import { OpenIdProviderComponent } from '../lib/share-component/open-id-provider/open-id-provider.component';
import { UserGroupListComponent } from '../lib/share-component/user-group-list/user-group-list.component';
import { UserListComponent } from '../lib/share-component/user-list/user-list.component';
import { UserSettingComponent } from '../lib/share-component/user-setting/user-setting.component';
import { HomeComponent } from './home/home.component';

// Centralized route helpers. Use these instead of stringly-typed paths everywhere.
//
// IA per `frontend-manager.md` § 4:
//   /catalog/{products,categories,tags,media}
//   /schema/{attribute-definitions,attribute-options}
//   /commerce/{orders,returns,shipments,discounts}
//   /inventory/{stock,movements}
//   /rules/{shipping,tax}
//   /reports, /reviews, /auth/login
//
// Detail-route convention: each entity gets THREE child routes —
//   /list  — index
//   /new   — create flow (the detail component in "no id yet" mode)
//   /:id   — edit flow (UUIDv7)
//
// The `xxx(id)` helpers map an empty/falsy id to `/new` so callers can write
// `routerLink: APP_ROUTES.catalogProduct(product.id)` without branching on whether
// `product.id` is set. The detail components map a `'new'` path-variable back to
// null in `getRouteId()` so `ViesRestApi.ngOnInit` skips the GET and shows a blank form.
export const APP_ROUTES = {
  home: "home",
  login: "login",
  setting: "setting",
  applicationSetting: "setting/application-setting",
  accountSetting: "setting/account",
  usersSetting: "setting/users",
  userGroupsSetting: "setting/user/groups",
  openidProviderSetting: "setting/openid-provider",
  oauth2: "oauth2",

  // ---- Catalog ----------------------------------------------------------
  catalogProductList: "catalog/products/list",
  catalogProductNew: "catalog/products/new",
  catalogProduct(id: string) {
    return id ? `catalog/products/${id}` : 'catalog/products/new';
  },

  catalogProductVariantNew(productId: string) {
    return `catalog/products/${productId}/variants/new`;
  },
  catalogProductVariant(productId: string, variantId: string) {
    return variantId
      ? `catalog/products/${productId}/variants/${variantId}`
      : `catalog/products/${productId}/variants/new`;
  },

  catalogTagList: "catalog/tags/list",
  catalogTagNew: "catalog/tags/new",
  catalogTag(id: string) {
    return id ? `catalog/tags/${id}` : 'catalog/tags/new';
  },

  catalogCategoryList: "catalog/categories/list",
  catalogCategoryNew: "catalog/categories/new",
  catalogCategory(id: string) {
    return id ? `catalog/categories/${id}` : 'catalog/categories/new';
  },

  // ---- Schema -----------------------------------------------------------
  schemaAttributeDefinitionList: "schema/attribute-definitions/list",
  schemaAttributeDefinitionNew: "schema/attribute-definitions/new",
  schemaAttributeDefinition(id: string) {
    return id ? `schema/attribute-definitions/${id}` : 'schema/attribute-definitions/new';
  },

  schemaAttributeOptionList: "schema/attribute-options/list",
  schemaAttributeOptionNew: "schema/attribute-options/new",
  schemaAttributeOption(id: string) {
    return id ? `schema/attribute-options/${id}` : 'schema/attribute-options/new';
  },

  // ---- Commerce ---------------------------------------------------------
  // Orders are NOT manually created — they come from checkout. So no /new
  // route; just list + detail. The detail is edit-only (status, notes,
  // notes.* metadata; everything else is read-only).
  commerceOrderList: "commerce/orders/list",
  commerceOrder(id: string) {
    return `commerce/orders/${id}`;
  },

  commerceShipmentList: "commerce/shipments/list",
  commerceShipmentNew: "commerce/shipments/new",
  commerceShipment(id: string) {
    return id ? `commerce/shipments/${id}` : 'commerce/shipments/new';
  },

  commerceReturnList: "commerce/returns/list",
  commerceReturnNew: "commerce/returns/new",
  commerceReturn(id: string) {
    return id ? `commerce/returns/${id}` : 'commerce/returns/new';
  },

  commerceDiscountList: "commerce/discounts/list",
  commerceDiscountNew: "commerce/discounts/new",
  commerceDiscount(id: string) {
    return id ? `commerce/discounts/${id}` : 'commerce/discounts/new';
  },

  // ---- Rules --------------------------------------------------------------
  rulesShippingList: "rules/shipping/list",
  rulesShippingNew: "rules/shipping/new",
  rulesShipping(id: string) {
    return id ? `rules/shipping/${id}` : 'rules/shipping/new';
  },

  rulesTaxList: "rules/tax/list",
  rulesTaxNew: "rules/tax/new",
  rulesTax(id: string) {
    return id ? `rules/tax/${id}` : 'rules/tax/new';
  },

  // ---- Inventory ------------------------------------------------------------
  inventoryStock: "inventory/stock",
  inventoryMovements: "inventory/movements",

  // ---- Reviews / Reports ------------------------------------------------------
  reviews: "reviews",
  reports: "reports",

  // ---- Shop (test-only buyer flow) ---------------------------------------------
  shopProducts: "shop/products",
  shopProduct(id: string) {
    return `shop/products/${id}`;
  },
  shopCart: "shop/cart",
  shopCheckout: "shop/checkout",
  shopOrders: "shop/orders",
  shopOrder(id: string) {
    return `shop/orders/${id}`;
  }
};

export const routes: Routes = [
  {
    path: "home",
    component: HomeComponent
  },
  {
    path: "login",
    component: LoginComponent
  },
  {
    path: "catalog",
    canActivate: [async () => inject(AuthGuard).isLoginWithRole('ADMIN')],
    children: [
      { path: '', redirectTo: 'products/list', pathMatch: 'full' },
      {
        path: "products",
        children: [
          { path: '', redirectTo: 'list', pathMatch: 'full' },
          {
            path: "list",
            loadComponent: () => import('./catalog/products/product-list/product-list.component').then(m => m.ProductListComponent)
          },
          {
            path: "new",
            loadComponent: () => import('./catalog/products/product.component').then(m => m.ProductComponent)
          },
          // Nested variant routes come BEFORE the bare `:productId` route so
          // the router matches the deeper path first.
          {
            path: ":productId/variants/new",
            loadComponent: () => import('./catalog/products/product-variant/product-variant.component').then(m => m.ProductVariantComponent)
          },
          {
            path: ":productId/variants/:variantId",
            loadComponent: () => import('./catalog/products/product-variant/product-variant.component').then(m => m.ProductVariantComponent)
          },
          {
            path: ":productId",
            loadComponent: () => import('./catalog/products/product.component').then(m => m.ProductComponent)
          }
        ]
      },
      {
        path: "tags",
        children: [
          { path: '', redirectTo: 'list', pathMatch: 'full' },
          {
            path: "list",
            loadComponent: () => import('./catalog/tags/tag-list/tag-list.component').then(m => m.TagListComponent)
          },
          {
            path: "new",
            loadComponent: () => import('./catalog/tags/tag/tag.component').then(m => m.TagComponent)
          },
          {
            path: ":tagId",
            loadComponent: () => import('./catalog/tags/tag/tag.component').then(m => m.TagComponent)
          }
        ]
      },
      {
        path: "categories",
        children: [
          { path: '', redirectTo: 'list', pathMatch: 'full' },
          {
            path: "list",
            loadComponent: () => import('./catalog/categories/category-list/category-list.component').then(m => m.CategoryListComponent)
          },
          {
            path: "new",
            loadComponent: () => import('./catalog/categories/category/category.component').then(m => m.CategoryComponent)
          },
          {
            path: ":categoryId",
            loadComponent: () => import('./catalog/categories/category/category.component').then(m => m.CategoryComponent)
          }
        ]
      }
    ]
  },
  {
    path: "schema",
    canActivate: [async () => inject(AuthGuard).isLoginWithRole('ADMIN')],
    children: [
      { path: '', redirectTo: 'attribute-definitions/list', pathMatch: 'full' },
      {
        path: "attribute-definitions",
        children: [
          { path: '', redirectTo: 'list', pathMatch: 'full' },
          {
            path: "list",
            loadComponent: () => import('./schema/attribute-definitions/attribute-definition-list/attribute-definition-list.component').then(m => m.AttributeDefinitionListComponent)
          },
          {
            path: "new",
            loadComponent: () => import('./schema/attribute-definitions/attribute-definition/attribute-definition.component').then(m => m.AttributeDefinitionComponent)
          },
          {
            path: ":attributeDefinitionId",
            loadComponent: () => import('./schema/attribute-definitions/attribute-definition/attribute-definition.component').then(m => m.AttributeDefinitionComponent)
          }
        ]
      },
      {
        path: "attribute-options",
        children: [
          { path: '', redirectTo: 'list', pathMatch: 'full' },
          {
            path: "list",
            loadComponent: () => import('./schema/attribute-options/attribute-option-list/attribute-option-list.component').then(m => m.AttributeOptionListComponent)
          },
          {
            path: "new",
            loadComponent: () => import('./schema/attribute-options/attribute-option/attribute-option.component').then(m => m.AttributeOptionComponent)
          },
          {
            path: ":attributeOptionId",
            loadComponent: () => import('./schema/attribute-options/attribute-option/attribute-option.component').then(m => m.AttributeOptionComponent)
          }
        ]
      }
    ]
  },
  {
    path: "commerce",
    canActivate: [async () => inject(AuthGuard).isLoginWithRole('ADMIN')],
    children: [
      { path: '', redirectTo: 'orders/list', pathMatch: 'full' },
      {
        path: "orders",
        children: [
          { path: '', redirectTo: 'list', pathMatch: 'full' },
          {
            path: "list",
            loadComponent: () => import('./commerce/orders/order-list/order-list.component').then(m => m.OrderListComponent)
          },
          {
            path: ":orderId",
            loadComponent: () => import('./commerce/orders/order/order.component').then(m => m.OrderComponent)
          }
        ]
      },
      {
        path: "shipments",
        children: [
          { path: '', redirectTo: 'list', pathMatch: 'full' },
          {
            path: "list",
            loadComponent: () => import('./commerce/shipments/shipment-list/shipment-list.component').then(m => m.ShipmentListComponent)
          },
          {
            path: "new",
            loadComponent: () => import('./commerce/shipments/shipment/shipment.component').then(m => m.ShipmentComponent)
          },
          {
            path: ":shipmentId",
            loadComponent: () => import('./commerce/shipments/shipment/shipment.component').then(m => m.ShipmentComponent)
          }
        ]
      },
      {
        path: "returns",
        children: [
          { path: '', redirectTo: 'list', pathMatch: 'full' },
          {
            path: "list",
            loadComponent: () => import('./commerce/returns/return-list/return-list.component').then(m => m.ReturnListComponent)
          },
          {
            path: "new",
            loadComponent: () => import('./commerce/returns/return/return.component').then(m => m.ReturnComponent)
          },
          {
            path: ":returnId",
            loadComponent: () => import('./commerce/returns/return/return.component').then(m => m.ReturnComponent)
          }
        ]
      },
      {
        path: "discounts",
        children: [
          { path: '', redirectTo: 'list', pathMatch: 'full' },
          {
            path: "list",
            loadComponent: () => import('./commerce/discounts/discount-list/discount-list.component').then(m => m.DiscountListComponent)
          },
          {
            path: "new",
            loadComponent: () => import('./commerce/discounts/discount/discount.component').then(m => m.DiscountComponent)
          },
          {
            path: ":discountId",
            loadComponent: () => import('./commerce/discounts/discount/discount.component').then(m => m.DiscountComponent)
          }
        ]
      }
    ]
  },
  {
    path: "rules",
    canActivate: [async () => inject(AuthGuard).isLoginWithRole('ADMIN')],
    children: [
      { path: '', redirectTo: 'shipping/list', pathMatch: 'full' },
      {
        path: "shipping",
        children: [
          { path: '', redirectTo: 'list', pathMatch: 'full' },
          {
            path: "list",
            loadComponent: () => import('./rules/shipping/shipping-rule-list/shipping-rule-list.component').then(m => m.ShippingRuleListComponent)
          },
          {
            path: "new",
            loadComponent: () => import('./rules/shipping/shipping-rule/shipping-rule.component').then(m => m.ShippingRuleComponent)
          },
          {
            path: ":shippingRuleId",
            loadComponent: () => import('./rules/shipping/shipping-rule/shipping-rule.component').then(m => m.ShippingRuleComponent)
          }
        ]
      },
      {
        path: "tax",
        children: [
          { path: '', redirectTo: 'list', pathMatch: 'full' },
          {
            path: "list",
            loadComponent: () => import('./rules/tax/tax-rule-list/tax-rule-list.component').then(m => m.TaxRuleListComponent)
          },
          {
            path: "new",
            loadComponent: () => import('./rules/tax/tax-rule/tax-rule.component').then(m => m.TaxRuleComponent)
          },
          {
            path: ":taxRuleId",
            loadComponent: () => import('./rules/tax/tax-rule/tax-rule.component').then(m => m.TaxRuleComponent)
          }
        ]
      }
    ]
  },
  {
    path: "inventory",
    canActivate: [async () => inject(AuthGuard).isLoginWithRole('ADMIN')],
    children: [
      { path: '', redirectTo: 'stock', pathMatch: 'full' },
      {
        path: "stock",
        loadComponent: () => import('./inventory/stock/stock.component').then(m => m.StockComponent)
      },
      {
        path: "movements",
        loadComponent: () => import('./inventory/stock-movement-list/stock-movement-list.component').then(m => m.StockMovementListComponent)
      }
    ]
  },
  {
    path: "reviews",
    canActivate: [async () => inject(AuthGuard).isLoginWithRole('ADMIN')],
    loadComponent: () => import('./reviews/review-list/review-list.component').then(m => m.ReviewListComponent)
  },
  {
    // Test-only buyer-flow simulation. Login required (carts/orders are
    // user-scoped) but NOT admin-gated — any authenticated test user works.
    path: "shop",
    canActivate: [async () => inject(AuthGuard).isLogin()],
    children: [
      { path: '', redirectTo: 'products', pathMatch: 'full' },
      {
        path: "products",
        loadComponent: () => import('./shop/product-list/shop-product-list.component').then(m => m.ShopProductListComponent)
      },
      {
        path: "products/:productId",
        loadComponent: () => import('./shop/product/shop-product.component').then(m => m.ShopProductComponent)
      },
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
    path: "reports",
    canActivate: [async () => inject(AuthGuard).isLoginWithRole('ADMIN')],
    loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent)
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
      },
      {
        path: 'users',
        component: UserListComponent,
        canActivate: [async () => inject(AuthGuard).isLogin()]
      },
      {
        path: 'user/groups',
        component: UserGroupListComponent,
        canActivate: [async () => inject(AuthGuard).isLogin()]
      },
      {
        path: 'openid-provider',
        component: OpenIdProviderComponent,
        canActivate: [async () => inject(AuthGuard).isLogin()]
      }
    ]
  },
  {
    path: 'oauth2',
    component: LoginComponent
  },
  {
    path: "**",
    redirectTo: "home"
  }
];
