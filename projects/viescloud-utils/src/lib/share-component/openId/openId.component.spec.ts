/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { OpenIdComponent } from './openId.component';

describe('OpenIdComponent', () => {
  let component: OpenIdComponent;
  let fixture: ComponentFixture<OpenIdComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OpenIdComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenIdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
