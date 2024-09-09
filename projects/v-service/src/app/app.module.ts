import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ViescloudUtilsModule } from 'projects/viescloud-utils/src/public-api';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from 'projects/viescloud-utils/src/lib/guards/auth.interceptor';
import { HomeComponent } from 'projects/v-console/src/app/home/home.component';
import { VincentComponent } from './about/vincent/vincent.component';
import { AiReaderBodyComponent } from './ai_reader/ai-reader-body/ai-reader-body.component';
import { SideDrawerAiReaderComponent } from './ai_reader/side-drawer-ai-reader/side-drawer-ai-reader.component';
import { AngularServiceGeneratorComponent } from './cool_util/angular-service-generator/angular-service-generator.component';
import { CoolSymbolComponent } from './cool_util/cool-symbol/cool-symbol.component';
import { SpringBootSnippetV01Component } from './cool_util/Spring-boot-snippet-v01/Spring-boot-snippet-v01.component';
import { BattleshipComponent } from './game/battleship/battleship.component';
import { LobbyDetailComponent } from './game/lobby/lobby-detail/lobby-detail.component';
import { LobbyComponent } from './game/lobby/lobby.component';
import { RegisterComponent } from './register/register.component';
import { UserSettingComponent } from './setting/user-setting/user-setting.component';
import { SideDrawerMainMenuComponent } from './side-drawer/side-drawer-main-menu/side-drawer-main-menu.component';
import { SideDrawerComponent } from './side-drawer/side-drawer.component';
import { GeneralQuestionsComponent } from './trivia/general-questions/general-questions.component';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

const GAMES = [
  BattleshipComponent,
  LobbyComponent,
  LobbyDetailComponent,
]

const COOL_SERVICE = [
  AngularServiceGeneratorComponent,
  CoolSymbolComponent,
  SpringBootSnippetV01Component,
]

const SIDE_DRAWER = [
  SideDrawerComponent,
  SideDrawerMainMenuComponent
]

const AI_READER = [
  AiReaderBodyComponent,
  SideDrawerAiReaderComponent
]

const LIST = [
  AppComponent,
  HomeComponent,
  RegisterComponent,
  VincentComponent,
  GeneralQuestionsComponent,
  UserSettingComponent,
]

@NgModule({
  declarations: [
    ...GAMES,
    ...COOL_SERVICE,
    ...SIDE_DRAWER,
    ...AI_READER,
    ...LIST
  ],
  imports: [
    AppRoutingModule,
    ViescloudUtilsModule,
    NgxExtendedPdfViewerModule
  ],
  providers: [{
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
