import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ViescloudUtilsModule } from 'projects/viescloud-utils/src/lib/viescloud-utils.module';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { DnsManagerSettingService } from './service/dns-manager.setting.service';
import { AuthInterceptor } from 'projects/viescloud-utils/src/lib/guards/auth.interceptor';
import { SettingService } from 'projects/viescloud-utils/src/lib/service/setting.service';
import { ObjectStorageService } from 'projects/viescloud-utils/src/lib/service/object-storage-manager.service';
import { DnsManagerObjectStorageService } from './service/dns-manager.object.storage.service';
import { DnsSettingListComponent } from './dns-setting-list/dns-setting-list.component';
import { DnsRecordListComponent } from './dns-record-list/dns-record-list.component';
import { DnsRecordComponent } from './dns-record/dns-record.component';

const LIST = [
  AppComponent,
  DnsSettingListComponent,
  DnsRecordListComponent,
  DnsRecordComponent
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
      useClass: DnsManagerSettingService
    },
    {
      provide: ObjectStorageService,
      useClass: DnsManagerObjectStorageService
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
