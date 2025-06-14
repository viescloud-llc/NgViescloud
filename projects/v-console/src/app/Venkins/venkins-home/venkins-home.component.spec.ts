/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { VenkinsHomeComponent } from './venkins-home.component';

describe('VenkinsHomeComponent', () => {
  let component: VenkinsHomeComponent;
  let fixture: ComponentFixture<VenkinsHomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ VenkinsHomeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VenkinsHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
