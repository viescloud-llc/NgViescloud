import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { MatNativeDateModule } from '@angular/material/core';

const list = [
  CommonModule,
  BrowserModule,
  FormsModule,
  BrowserAnimationsModule,
  HttpClientModule,
  ReactiveFormsModule,
  MatNativeDateModule
]

@NgModule({
  declarations: [

  ],
  imports: list,
  exports: list
})
export class NgEssentialModule { }
