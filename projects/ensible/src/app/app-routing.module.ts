import { inject, NgModule } from '@angular/core';
import { RouterModule, Routes, CanDeactivate } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { EnsibleSettingComponent } from './ensible-setting/ensible-setting.component';
import { EnsibleFsComponent } from './ensible-fs/ensible-fs.component';
import { EnsibleItemTabComponent } from './item/ensible-item-tab/ensible-item-tab.component';
import { EnsibleAnsibleCfgComponent } from './ensible-ansible-cfg/ensible-ansible-cfg.component';
import { EnsibleFsListComponent } from './ensible-fs-list/ensible-fs-list.component';
import { EnsibleDockerContainerTemplateListComponent } from './docker/ensible-docker-container-template-list/ensible-docker-container-template-list.component';
import { EnsibleDockerContainerTemplateComponent } from './docker/ensible-docker-container-template/ensible-docker-container-template.component';
import { AuthGuard, CanDeactivateGuard } from 'projects/viescloud-utils/src/lib/guards/auth.guard';
import { EnsibleItemListPlaybookComponent } from './item/ensible-item-list/ensible-item-list-playbook/ensible-item-list-playbook.component';
import { EnsibleItemListShellComponent } from './item/ensible-item-list/ensible-item-list-shell/ensible-item-list-shell.component';
import { LoginComponent } from 'projects/viescloud-utils/src/lib/share-component/login/login.component';
import { UserSettingComponent } from 'projects/viescloud-utils/src/lib/share-component/user-setting/user-setting.component';
import { UserListComponent } from 'projects/viescloud-utils/src/lib/share-component/user-list/user-list.component';
import { UserGroupListComponent } from 'projects/viescloud-utils/src/lib/share-component/user-group-list/user-group-list.component';
import { OpenIdProviderComponent } from 'projects/viescloud-utils/src/lib/share-component/open-id-provider/open-id-provider.component';

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
    canActivate: [async () => inject(AuthGuard).isLogin()],
    canActivateChild: [async () => inject(AuthGuard).isLogin()],
    children: [
      {
        path: 'playbooks/all',
        component: EnsibleItemListPlaybookComponent
      },
      {
        path: 'playbooks/:id',
        component: EnsibleItemTabComponent
      },
      {
        path: 'shells/all',
        component: EnsibleItemListShellComponent
      },
      {
        path: 'shells/:id',
        component: EnsibleItemTabComponent
      }
    ]
  },
  {
    path: 'docker',
    canActivate: [async () => inject(AuthGuard).isLogin()],
    canActivateChild: [async () => inject(AuthGuard).isLogin()],
    children: [
      {
        path: 'container/templates',
        component: EnsibleDockerContainerTemplateListComponent
      },
      {
        path: 'container/template/:id',
        component: EnsibleDockerContainerTemplateComponent
      }
    ]
  },
  {
    path: 'file',
    canActivate: [async () => inject(AuthGuard).isLogin()],
    canActivateChild: [async () => inject(AuthGuard).isLogin()],
    children: [
      {
        path: '**',
        component: EnsibleFsComponent,
        canDeactivate: [CanDeactivateGuard]
      }
    ]
  },
  {
    path: 'files',
    canActivate: [async () => inject(AuthGuard).isLogin()],
    canActivateChild: [async () => inject(AuthGuard).isLogin()],
    children: [
      {
        path: '**',
        component: EnsibleFsListComponent
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
        path: 'ansible.cfg',
        component: EnsibleAnsibleCfgComponent,
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
