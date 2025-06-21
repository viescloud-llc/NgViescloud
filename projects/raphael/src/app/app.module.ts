import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ViescloudUtilsModule } from 'projects/viescloud-utils/src/lib/viescloud-utils.module';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from 'projects/viescloud-utils/src/lib/guards/auth.interceptor';
import { SettingService } from 'projects/viescloud-utils/src/lib/service/setting.service';
import { RaphaelSettingService } from './service/raphael.setting.service';

const LIST = [
  AppComponent
]

@NgModule({
  declarations: [
    ...LIST
  ],
  imports: [
    ViescloudUtilsModule,
    AppRoutingModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: SettingService,
      useClass: RaphaelSettingService
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
