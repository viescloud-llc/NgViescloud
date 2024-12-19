import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { EnsibleSettingComponent } from './ensible-setting/ensible-setting.component';
import { EnsibleFsComponent } from './ensible-fs/ensible-fs.component';
import { EnsibleUserComponent } from './ensible-user/ensible-user.component';
import { EnsibleItemListComponent } from './item/ensible-item-list/ensible-item-list.component';
import { EnsibleItemComponent } from './item/ensible-item/ensible-item.component';
import { EnsibleItemTabComponent } from './item/ensible-item-tab/ensible-item-tab.component';

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
    path: "item",
    children: [
      {
        path: 'all',
        component: EnsibleItemListComponent
      },
      {
        path: ':id',
        component: EnsibleItemTabComponent
      }
    ]
  },
  {
    path: 'roles',
    children: [
      {
        path: '**',
        component: EnsibleFsComponent
      }
    ]
  },
  {
    path: 'inventory',
    children: [
      {
        path: '**',
        component: EnsibleFsComponent
      }
    ]
  },
  {
    path: 'playbooks',
    children: [
      {
        path: '**',
        component: EnsibleFsComponent
      }
    ]
  },
  {
    path: 'secrets',
    children: [
      {
        path: '**',
        component: EnsibleFsComponent
      }
    ]
  },
  {
    path: 'passwords',
    children: [
      {
        path: '**',
        component: EnsibleFsComponent
      }
    ]
  },
  {
    path: 'setting',
    children: [
      {
        path: 'application-setting',
        component: EnsibleSettingComponent
      },
      {
        path: 'users',
        component: EnsibleUserComponent
      }
    ]
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
