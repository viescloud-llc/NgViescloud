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
import { ProductListComponent } from './product/product-list/product-list.component';
import { ProductComponent } from './product/product.component';

export const APP_ROUTES = {
  home: "home",
  login: "login",
  productList: "product/list",
  setting: "setting",
  applicationSetting: "setting/application-setting",
  accountSetting: "setting/account",
  usersSetting: "setting/users",
  userGroupsSetting: "setting/user/groups",
  openidProviderSetting: "setting/openid-provider",
  oauth2: "oauth2",

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
        component: ProductListComponent
      },
      {
        path: ":productId",
        component: ProductComponent
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