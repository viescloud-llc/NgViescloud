/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { RouteDialog } from './route-dialog.component';

describe('RouteDialogComponent', () => {
  let component: RouteDialog;
  let fixture: ComponentFixture<RouteDialog>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RouteDialog ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RouteDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
