import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ViescloudUtilsModule } from 'projects/viescloud-utils/src/lib/viescloud-utils.module';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from 'projects/viescloud-utils/src/lib/guards/auth.interceptor';
import { SettingService } from 'projects/viescloud-utils/src/lib/service/setting.service';
import { SkeletonSettingService } from './service/skeleton.setting.service';
import { ObjectStorageService } from 'projects/viescloud-utils/src/lib/service/object-storage-manager.service';
import { SkeletonObjectStorageService } from './service/skeleton.object.storage.service';

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
      useClass: SkeletonSettingService
    },
    {
      provide: ObjectStorageService,
      useClass: SkeletonObjectStorageService
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
