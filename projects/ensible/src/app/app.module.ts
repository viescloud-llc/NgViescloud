import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ViescloudUtilsModule } from 'projects/viescloud-utils/src/public-api';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { EnsibleAuthInterceptor } from './guard/ensible-auth.interceptor';
import { EnsibleSettingComponent } from './ensible-setting/ensible-setting.component';
import { EnsibleRoleComponent } from './ensible-role/ensible-role.component';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { EnsibleFsComponent } from './ensible-fs/ensible-fs.component';

const LIST = [
  AppComponent,
  HomeComponent,
  LoginComponent,
  EnsibleSettingComponent,
  EnsibleRoleComponent,
  EnsibleFsComponent,
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
      useClass: EnsibleAuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
