/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { WrapItemComponent } from './wrap-item.component';

describe('WrapItemComponent', () => {
  let component: WrapItemComponent;
  let fixture: ComponentFixture<WrapItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WrapItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WrapItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
