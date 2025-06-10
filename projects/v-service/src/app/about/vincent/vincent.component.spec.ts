/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { VincentComponent } from './vincent.component';

describe('VincentComponent', () => {
  let component: VincentComponent;
  let fixture: ComponentFixture<VincentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VincentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VincentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
