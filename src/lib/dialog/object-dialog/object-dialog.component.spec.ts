/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ObjectDialog } from './object-dialog.component';

describe('ObjectDialogComponent', () => {
  let component: ObjectDialog;
  let fixture: ComponentFixture<ObjectDialog>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ObjectDialog ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
