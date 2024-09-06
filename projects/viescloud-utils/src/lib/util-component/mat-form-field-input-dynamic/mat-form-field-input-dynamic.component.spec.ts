/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { MatFormFieldInputDynamicComponent } from './mat-form-field-input-dynamic.component';

describe('MatFormFieldInputDynamicComponent', () => {
  let component: MatFormFieldInputDynamicComponent;
  let fixture: ComponentFixture<MatFormFieldInputDynamicComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MatFormFieldInputDynamicComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MatFormFieldInputDynamicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
