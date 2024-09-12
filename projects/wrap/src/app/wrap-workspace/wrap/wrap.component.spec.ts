/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { WrapComponent } from './wrap.component';

describe('WrapComponent', () => {
  let component: WrapComponent;
  let fixture: ComponentFixture<WrapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WrapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WrapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
