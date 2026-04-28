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
  
  productList: "product/list",
  productAttributeDefinitionList: "product/attribute/definition/list",
  productAttributeOptionList: "product/attribute/option/list",

  productAttributeOption(id: number) {
    return `product/attribute/option/${id}`;
  },

  productAttributeDefinition(id: number) {
    return `product/attribute/definition/${id}`;
  },

  product(id: number) {
    return `product/${id}`;
  }
}

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
    path: "product",
    children: [
      {
        path: "list",
        loadComponent: () => import('./product/product-list/product-list.component').then(m => m.ProductListComponent)
      },
      {
        path: ":productId",
        loadComponent: () => import('./product/product.component').then(m => m.ProductComponent)
      },
      {
        path: "attribute",
        children: [
          {
            path: "definition",
            children: [
              {
                path: "list",
                loadComponent: () => import('./product/attribute-definition-list/attribute-definition-list.component').then(m => m.AttributeDefinitionListComponent)
              },
              {
                path: ":attributeDefinitionId",
                loadComponent: () => import('./product/attribute-definition/attribute-definition.component').then(m => m.AttributeDefinitionComponent)
              }
            ]
          },
          {
            path: "option",
            children: [
              {
                path: "list",
                loadComponent: () => import('./product/attribute-option-list/attribute-option-list.component').then(m => m.AttributeOptionListComponent)
              },
              {
                path: ":attributeOptionId",
                loadComponent: () => import('./product/attribute-option/attribute-option.component').then(m => m.AttributeOptionComponent)
              }
            ]
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