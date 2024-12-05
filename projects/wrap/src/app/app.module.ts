import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ViescloudUtilsModule } from 'projects/viescloud-utils/src/public-api';
import { HomeComponent } from './Home/Home.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from 'projects/viescloud-utils/src/lib/guards/auth.interceptor';
import { WrapWorkspaceComponent } from './wrap-workspace/wrap-workspace.component';
import { WrapComponent } from './wrap-workspace/wrap/wrap.component';
import { WrapItemComponent } from './wrap-workspace/wrap-item/wrap-item.component';
import { WrapPlusButtonComponent } from './wrap-workspace/wrap-plus-button/wrap-plus-button.component';
import { WrapJsonComponent } from './wrap-workspace/wrap-json/wrap-json.component';
import { WrapTreeComponent } from './wrap-workspace/wrap-tree/wrap-tree.component';
import { PolicyComponent } from './policy/policy.component';
import { WrapSettingComponent } from './wrap-setting/wrap-setting.component';

const LIST = [
  AppComponent,
  HomeComponent,
  WrapWorkspaceComponent,
  WrapComponent,
  WrapItemComponent,
  WrapPlusButtonComponent,
  WrapJsonComponent,
  WrapTreeComponent,
  PolicyComponent,
  WrapSettingComponent
]

@NgModule({
  declarations: [				
    ...LIST
   ],
  imports: [
    ViescloudUtilsModule,
    AppRoutingModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
