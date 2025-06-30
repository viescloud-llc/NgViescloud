/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { CopyToClipboardUtilComponent } from './copy-to-clipboard-util.component';

describe('CopyToClipboardUtilComponent', () => {
  let component: CopyToClipboardUtilComponent;
  let fixture: ComponentFixture<CopyToClipboardUtilComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CopyToClipboardUtilComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CopyToClipboardUtilComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
