/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { InputDialog } from './input-dialog.component';

describe('InputDialogComponent', () => {
  let component: InputDialog;
  let fixture: ComponentFixture<InputDialog>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InputDialog ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InputDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
