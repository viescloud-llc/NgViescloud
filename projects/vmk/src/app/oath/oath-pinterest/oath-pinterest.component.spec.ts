/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { OathPinterestComponent } from './oath-pinterest.component';

describe('OathPinterestComponent', () => {
  let component: OathPinterestComponent;
  let fixture: ComponentFixture<OathPinterestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OathPinterestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OathPinterestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
