import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from 'projects/viescloud-utils/src/lib/share-component/login/login.component';
import { HomeComponent } from './Home/Home.component';
import { OpenIdComponent } from 'projects/viescloud-utils/src/lib/share-component/openId/openId.component';
import { LogoutComponent } from 'projects/viescloud-utils/src/lib/share-component/logout/logout.component';
import { WrapWorkspaceComponent } from './wrap-workspace/wrap-workspace.component';
import { PolicyComponent } from './policy/policy.component';
import { ApplicationSettingComponent } from 'projects/viescloud-utils/src/lib/share-component/application-setting/application-setting.component';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'logout',
    component: LogoutComponent
  },
  {
    path: 'openId',
    component: OpenIdComponent
  },
  {
    path: 'wrap-workspace',
    component: WrapWorkspaceComponent
  },
  {
    path: 'setting',
    children: [
      {
        path: 'application-setting',
        component: ApplicationSettingComponent
      }
    ]
  },
  {
    path: 'policy',
    component: PolicyComponent
  },

  // default path
  {
    path: '**',
    component: HomeComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
