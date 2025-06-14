import { inject, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from 'projects/viescloud-utils/src/lib/share-component/login/login.component';
import { HomeComponent } from './home/home.component';
import { ApplicationSettingComponent } from 'projects/viescloud-utils/src/lib/share-component/application-setting/application-setting.component';
import { UserSettingComponent } from 'projects/viescloud-utils/src/lib/share-component/user-setting/user-setting.component';
import { AuthGuard } from 'projects/viescloud-utils/src/lib/guards/auth.guard';
import { UserListComponent } from 'projects/viescloud-utils/src/lib/share-component/user-list/user-list.component';
import { UserGroupListComponent } from 'projects/viescloud-utils/src/lib/share-component/user-group-list/user-group-list.component';
import { OpenIdProviderComponent } from 'projects/viescloud-utils/src/lib/share-component/open-id-provider/open-id-provider.component';
import { DnsSettingListComponent } from './dns-setting-list/dns-setting-list.component';
import { DnsRecordListComponent } from './dns-record-list/dns-record-list.component';

const routes: Routes = [
  {
    path: "home",
    component: HomeComponent
  },
  {
    path: "login",
    component: LoginComponent
  },
  {
    path: "dns-manager",
    canActivate: [async () => inject(AuthGuard).isLogin()],
    canActivateChild: [async () => inject(AuthGuard).isLogin()],
    children: [
      {
        path: 'record',
        component: DnsRecordListComponent
      },
      {
        path: 'setting',
        component: DnsSettingListComponent
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
    component: HomeComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
