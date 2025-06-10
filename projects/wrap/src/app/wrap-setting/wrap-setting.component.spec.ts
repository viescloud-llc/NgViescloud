/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { WrapSettingComponent } from './wrap-setting.component';

describe('WrapSettingComponent', () => {
  let component: WrapSettingComponent;
  let fixture: ComponentFixture<WrapSettingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WrapSettingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WrapSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
