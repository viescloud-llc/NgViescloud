/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { MatFormFieldInputRgbColorPickerComponent } from './mat-form-field-input-rgb-color-picker.component';

describe('MatFormFieldInputRgbColorPickerComponent', () => {
  let component: MatFormFieldInputRgbColorPickerComponent;
  let fixture: ComponentFixture<MatFormFieldInputRgbColorPickerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MatFormFieldInputRgbColorPickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MatFormFieldInputRgbColorPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
