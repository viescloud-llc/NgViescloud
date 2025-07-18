import { NgModule } from '@angular/core';

import { CdkTableModule } from '@angular/cdk/table';
import { MatButtonModule } from "@angular/material/button";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatListModule } from "@angular/material/list";
import { MatCardModule } from "@angular/material/card";
import { MatTableModule } from "@angular/material/table";
import { MatDialogModule } from "@angular/material/dialog";
import { MatSelectModule } from "@angular/material/select";
import { MatBadgeModule } from "@angular/material/badge";
import { MatRadioModule } from "@angular/material/radio";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { MatTreeModule } from '@angular/material/tree';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatStepperModule } from '@angular/material/stepper';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCheckboxModule } from '@angular/material/checkbox';

const list = [
  MatButtonModule,
  MatToolbarModule,
  MatIconModule,
  MatInputModule,
  MatSidenavModule,
  MatListModule,
  MatCardModule,
  MatTableModule,
  MatDialogModule,
  MatSelectModule,
  MatBadgeModule,
  MatRadioModule,
  MatExpansionModule,
  CdkTableModule,
  MatMenuModule,
  MatFormFieldModule,
  MatPaginatorModule,
  FormsModule,
  MatTreeModule,
  MatTabsModule,
  MatSnackBarModule,
  MatSortModule,
  MatStepperModule,
  MatDatepickerModule,
  MatAutocompleteModule,
  MatSlideToggleModule,
  MatSliderModule,
  MatProgressSpinnerModule,
  MatTooltipModule,
  MatChipsModule,
  DragDropModule,
  OverlayModule,
  MatGridListModule,
  MatCheckboxModule,
]

@NgModule({
  declarations: [
    
  ],
  imports: list,
  exports: list
})
export class NgMaterialModule { }
