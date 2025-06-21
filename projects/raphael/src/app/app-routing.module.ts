import { inject, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from 'projects/viescloud-utils/src/lib/share-component/login/login.component';
import { ApplicationSettingComponent } from 'projects/viescloud-utils/src/lib/share-component/application-setting/application-setting.component';
import { AuthGuard } from 'projects/viescloud-utils/src/lib/guards/auth.guard';
import { OpenIdProviderComponent } from 'projects/viescloud-utils/src/lib/share-component/open-id-provider/open-id-provider.component';
import { UserGroupListComponent } from 'projects/viescloud-utils/src/lib/share-component/user-group-list/user-group-list.component';
import { UserListComponent } from 'projects/viescloud-utils/src/lib/share-component/user-list/user-list.component';
import { UserSettingComponent } from 'projects/viescloud-utils/src/lib/share-component/user-setting/user-setting.component';
import { SimpleTtsComponent } from './tts/simple-tts/simple-tts.component';
import { TextTtsComponent } from './tts/text-tts/text-tts.component';

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
    path: "tts",
    canActivate: [async () => inject(AuthGuard).isLogin()],
    canActivateChild: [async () => inject(AuthGuard).isLogin()],
    children: [
      {
        path: "simple-tts",
        component: SimpleTtsComponent
      },
      {
        path: "text-tts",
        component: TextTtsComponent
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
