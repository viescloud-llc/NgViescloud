import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatNativeDateModule } from '@angular/material/core';
import { provideHttpClient } from '@angular/common/http';

const list = [
  CommonModule,
  BrowserModule,
  FormsModule,
  BrowserAnimationsModule,
  ReactiveFormsModule,
  MatNativeDateModule
]

@NgModule({
  declarations: [

  ],
  imports: list,
  exports: list,
  providers: [provideHttpClient()]
})
export class NgEssentialModule { }
