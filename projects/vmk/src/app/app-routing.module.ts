import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'projects/viescloud-utils/src/lib/guards/auth.guard';
import { LoginComponent } from 'projects/viescloud-utils/src/lib/share-component/login/login.component';
import { OpenIdComponent } from 'projects/viescloud-utils/src/lib/share-component/openId/openId.component';
import { PoliciesComponent } from './about/policies/policies.component';
import { ConnectedServiceComponent } from './connected-service/connected-service.component';
import { HomeComponent } from './home/home.component';
import { ProductCategoryComponent } from './marketing/product-category/product-category.component';
import { ProductComponent } from './marketing/productList/product/product.component';
import { ProductListComponent } from './marketing/productList/productList.component';
import { OathPinterestComponent } from './oath/oath-pinterest/oath-pinterest.component';
import { LogoutComponent } from 'projects/viescloud-utils/src/lib/share-component/logout/logout.component';

const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent
  },
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
    path: 'marketing',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    children: [
      {
        path: 'products/:id',
        component: ProductComponent
      },
      {
        path: 'products',
        component: ProductListComponent,
      },
      {
        path: 'categories',
        component: ProductCategoryComponent
      }
    ]
  },
  {
    path: 'connected-service',
    component: ConnectedServiceComponent
  },
  {
    path: 'oath',
    children: [
      {
        path: 'pinterest',
        component: OathPinterestComponent
      }
    ]
  },
  {
    path: 'about',
    children: [
      {
        path: 'policies',
        component: PoliciesComponent
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
