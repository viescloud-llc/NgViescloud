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
