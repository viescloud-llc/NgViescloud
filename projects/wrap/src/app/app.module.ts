import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ViescloudUtilsModule } from 'projects/viescloud-utils/src/public-api';
import { HomeComponent } from './Home/Home.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from 'projects/viescloud-utils/src/lib/guards/auth.interceptor';
import { WrapWorkspaceComponent } from './wrap-workspace/wrap-workspace.component';
import { WrapComponent } from './wrap-workspace/wrap/wrap.component';

const LIST = [
  AppComponent,
  HomeComponent,
  WrapWorkspaceComponent,
  WrapComponent
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
