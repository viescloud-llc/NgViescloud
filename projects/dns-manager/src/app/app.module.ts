import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ViescloudUtilsModule } from 'projects/viescloud-utils/src/lib/viescloud-utils.module';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { SettingService } from 'projects/viescloud-utils/src/lib/service/Setting.service';
import { SkeletonManagerSettingService } from './service/skeleton.setting.service';
import { SkeletonManagerAuthInterceptor } from './guard/skeleton-auth.interceptor';

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
      useClass: SkeletonManagerAuthInterceptor,
      multi: true
    },
    {
      provide: SettingService,
      useClass: SkeletonManagerSettingService
    },
    // {
    //   provide: S3StorageServiceV1,
    //   useClass: EnsibleDatabaseObjectStorageService
    // }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
