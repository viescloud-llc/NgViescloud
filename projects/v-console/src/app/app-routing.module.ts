import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { RequestSenderComponent } from './request-sender/request-sender.component';
import { RouteComponent } from './Authentication/route/route.component';
import { UserRoleComponent } from './Authentication/user-role/user-role.component';
import { UsersComponent } from './Authentication/users/users.component';
import { QuestionComponent } from './vgame/question/question.component';
import { VenkinsHomeComponent } from './Venkins/venkins-home/venkins-home.component';
import { ConfigMapComponent } from './Venkins/config-map/config-map.component';
import { AutoRouteComponent } from './Authentication/auto-route/auto-route.component';
import { OpenIdComponent } from 'projects/viescloud-utils/src/lib/share-component/openId/openId.component';
import { LoginComponent } from 'projects/viescloud-utils/src/lib/share-component/login/login.component';
import { AuthGuard } from 'projects/viescloud-utils/src/lib/guards/auth.guard';
import { ApplicationSettingComponent } from 'projects/viescloud-utils/src/lib/share-component/application-setting/application-setting.component';
import { DnsManagerComponent } from './dns-manager/dns-manager.component';

const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'openId',
    component: OpenIdComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },

  // iframe

  {
    path: 'iframe',
    children: [
      {
        path: 'login',
        component: LoginComponent
      }
    ]
  },

  // TOOL
  {
    path: 'tool',
    children: [
      {
        path: 'request_sender',
        component: RequestSenderComponent
      }
    ]
  },

  // TOOL
  {
    path: 'venkins',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      {
        path: 'home',
        component: VenkinsHomeComponent
      },
      {
        path: 'config_map',
        component: ConfigMapComponent
      }
    ]
  },

  {
    path: 'dns-manager',
    component: DnsManagerComponent,
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard]
  },

  // Authentication
  {
    path: 'authentication',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      {
        path: 'route',
        component: RouteComponent
      },
      {
        path: 'auto_route',
        component: AutoRouteComponent
      },
      {
        path: 'users',
        component: UsersComponent
      },
      {
        path: 'user_role',
        component: UserRoleComponent
      }
    ]
  },

  // VGame
  {
    path: 'vgame',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      {
        path: 'question',
        component: QuestionComponent
      }
    ]
  },

  //Setting

  {
    path: 'setting',
    children: [
      {
        path: 'application-setting',
        component: ApplicationSettingComponent
      }
    ]
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
