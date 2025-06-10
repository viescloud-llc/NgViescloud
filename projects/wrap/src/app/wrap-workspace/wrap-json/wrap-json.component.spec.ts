/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { WrapJsonComponent } from './wrap-json.component';

describe('WrapJsonComponent', () => {
  let component: WrapJsonComponent;
  let fixture: ComponentFixture<WrapJsonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WrapJsonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WrapJsonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
