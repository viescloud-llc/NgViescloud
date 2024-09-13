/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { WrapDialog } from './wrap-dialog.component';

describe('WrapDialogComponent', () => {
  let component: WrapDialog;
  let fixture: ComponentFixture<WrapDialog>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WrapDialog ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WrapDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
