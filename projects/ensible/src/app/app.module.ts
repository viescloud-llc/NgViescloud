import { EnsiblePullImageDialog } from './dialog/ensible-pull-image-dialog/ensible-pull-image-dialog.component';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ViescloudUtilsModule } from 'projects/viescloud-utils/src/public-api';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HomeComponent } from './home/home.component';
import { EnsibleSettingComponent } from './ensible-setting/ensible-setting.component';
import { EnsibleFsComponent } from './ensible-fs/ensible-fs.component';
import { EnsibleItemListComponent } from './item/ensible-item-list/ensible-item-list.component';
import { EnsibleItemComponent } from './item/ensible-item/ensible-item.component';
import { EnsibleItemRunComponent } from './item/ensible-item-run/ensible-item-run.component';
import { EnsibleItemRunHistoryComponent } from './item/ensible-item-run-history/ensible-item-run-history.component';
import { EnsibleItemTabComponent } from './item/ensible-item-tab/ensible-item-tab.component';
import { EnsibleAnsibleCfgComponent } from './ensible-ansible-cfg/ensible-ansible-cfg.component';
import { SettingService } from 'projects/viescloud-utils/src/lib/service/setting.service';
import { EnsibleSettingService } from './service/ensible-setting/ensible-setting.service';
import { S3StorageServiceV1 } from 'projects/viescloud-utils/src/lib/service/object-storage-manager.service';
import { EnsibleDatabaseObjectStorageService } from './service/ensible-database-object-storage/ensible-database-object-storage.service';
import { EnsibleFsListComponent } from './ensible-fs-list/ensible-fs-list.component';
import { EnsibleDockerContainerTemplateComponent } from './docker/ensible-docker-container-template/ensible-docker-container-template.component';
import { EnsibleDockerContainerTemplateListComponent } from './docker/ensible-docker-container-template-list/ensible-docker-container-template-list.component';
import { EnsibleItemListPlaybookComponent } from './item/ensible-item-list/ensible-item-list-playbook/ensible-item-list-playbook.component';
import { EnsibleItemListShellComponent } from './item/ensible-item-list/ensible-item-list-shell/ensible-item-list-shell.component';
import { EnsibleItemPlaybookComponent } from './item/ensible-item/ensible-item-playbook/ensible-item-playbook.component';
import { EnsibleItemShellComponent } from './item/ensible-item/ensible-item-shell/ensible-item-shell.component';
import { AuthInterceptor } from 'projects/viescloud-utils/src/lib/guards/auth.interceptor';

const LIST = [
  AppComponent,
  HomeComponent,
  EnsibleSettingComponent,
  EnsibleFsComponent,
  EnsibleItemListComponent,
  EnsibleItemListPlaybookComponent,
  EnsibleItemListShellComponent,
  EnsibleItemComponent,
  EnsibleItemPlaybookComponent,
  EnsibleItemShellComponent,
  EnsibleItemRunComponent,
  EnsibleItemRunHistoryComponent,
  EnsibleItemTabComponent,
  EnsibleAnsibleCfgComponent,
  EnsibleFsListComponent,
  EnsibleDockerContainerTemplateComponent,
  EnsibleDockerContainerTemplateListComponent,
  EnsiblePullImageDialog
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
      useClass: EnsibleSettingService
    },
    {
      provide: S3StorageServiceV1,
      useClass: EnsibleDatabaseObjectStorageService
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
