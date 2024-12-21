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
import { EnsibleAnsibleCfgComponent } from './ensible-ansible-cfg/ensible-ansible-cfg.component';

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
    path: 'file',
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
      },
      {
        path: 'ansible.cfg',
        component: EnsibleAnsibleCfgComponent
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
