import { NgModule } from '@angular/core';
import { ViescloudUtilsComponent } from './viescloud-utils.component';
import { NgEssentialModule } from './module/ng-essential.module';
import { NgMaterialModule } from './module/ng-material.module';
import { NgComponentModule } from './module/ng-component.module';
import { NgDialogModule } from './module/ng-dialog.module ';

@NgModule({
  declarations: [
    ViescloudUtilsComponent
  ],
  imports: [
    NgEssentialModule,
    NgMaterialModule,
    NgComponentModule,
    NgDialogModule,
  ],
  exports: [
    ViescloudUtilsComponent,
    NgEssentialModule,
    NgMaterialModule,
    NgComponentModule,
    NgDialogModule,
  ]
})
export class ViescloudUtilsModule { }
