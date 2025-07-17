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
    component: HomeComponent
  }
];