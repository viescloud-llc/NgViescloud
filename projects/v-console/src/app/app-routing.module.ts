import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { RequestSenderComponent } from './request-sender/request-sender.component';
import { RouteComponent } from './Authentication/route/route.component';
import { UserRoleComponent } from './Authentication/user-role/user-role.component';
import { UsersComponent } from './Authentication/users/users.component';
import { QuestionComponent } from './vgame/question/question.component';
import { VenkinsHomeComponent } from './Venkins/venkins-home/venkins-home.component';
import { ConfigMapComponent } from './Venkins/config-map/config-map.component';
import { OpenIdComponent } from './openId/openId.component';
import { AutoRouteComponent } from './Authentication/auto-route/auto-route.component';

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
  {
    path: 'register',
    component: RegisterComponent
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

  // Authentication
  {
    path: 'authentication',
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
    children: [
      {
        path: 'question',
        component: QuestionComponent
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
