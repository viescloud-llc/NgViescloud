/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { WrapTreeComponent } from './wrap-tree.component';

describe('WrapTreeComponent', () => {
  let component: WrapTreeComponent;
  let fixture: ComponentFixture<WrapTreeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WrapTreeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WrapTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
