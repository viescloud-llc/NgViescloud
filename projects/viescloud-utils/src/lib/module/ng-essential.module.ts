import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { MatNativeDateModule } from '@angular/material/core';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';

const list = [
  CommonModule,
  BrowserModule,
  FormsModule,
  BrowserAnimationsModule,
  HttpClientModule,
  ReactiveFormsModule,
  MatNativeDateModule,
  MonacoEditorModule
]

@NgModule({
  declarations: [

  ],
  imports: list,
  exports: list
})
export class NgEssentialModule { }
