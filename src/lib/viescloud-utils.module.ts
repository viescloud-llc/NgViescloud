import { NgModule } from '@angular/core';
import { NgEssentialModule } from './module/ng-essential.module';
import { NgMaterialModule } from './module/ng-material.module';
import { NgComponentModule } from './module/ng-component.module';
import { NgDialogModule } from './module/ng-dialog.module ';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';

@NgModule({
  declarations: [],
  imports: [
    NgEssentialModule,
    NgMaterialModule,
    NgComponentModule,
    NgDialogModule,
    MonacoEditorModule.forRoot()
  ],
  exports: [
    NgEssentialModule,
    NgMaterialModule,
    NgComponentModule,
    NgDialogModule
  ]
})
export class ViescloudUtilsModule { }
