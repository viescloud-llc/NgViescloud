import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ConnectedServiceComponent } from './connected-service/connected-service.component';
import { HomeComponent } from './home/home.component';
import { ProductCategoryComponent } from './marketing/product-category/product-category.component';
import { ProductBasicComponent } from './marketing/productList/product/product-basic/product-basic.component';
import { ProductDisplayComponent } from './marketing/productList/product/product-display/product-display.component';
import { ProductOverallComponent } from './marketing/productList/product/product-overall/product-overall.component';
import { ProductComponent } from './marketing/productList/product/product.component';
import { ProductListComponent } from './marketing/productList/productList.component';
import { OathPinterestComponent } from './oath/oath-pinterest/oath-pinterest.component';
import { ViescloudUtilsModule } from 'projects/viescloud-utils/src/public-api';
import { AuthInterceptor } from 'projects/viescloud-utils/src/lib/guards/auth.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ProductMenuComponent } from './marketing/productList/product/product-menu/product-menu.component';
import { ProductPinterestComponent } from './marketing/productList/product/product-pinterest/product-pinterest.component';
import { ProductDisplayVideoComponent } from './marketing/productList/product/product-display-video/product-display-video.component';

const LIST = [
  AppComponent,
  HomeComponent,
  OathPinterestComponent,
  ConnectedServiceComponent
]

const MARKETING = [
  ProductListComponent,
  ProductCategoryComponent,
  ProductComponent,
  ProductBasicComponent,
  ProductDisplayComponent,
  ProductOverallComponent,
  ProductMenuComponent,
  ProductPinterestComponent,
  ProductDisplayVideoComponent
]

@NgModule({
  declarations: [
    AppComponent,
    ...LIST,
    ...MARKETING
  ],
  imports: [
    AppRoutingModule,
    ViescloudUtilsModule
  ],
  providers: [{
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
