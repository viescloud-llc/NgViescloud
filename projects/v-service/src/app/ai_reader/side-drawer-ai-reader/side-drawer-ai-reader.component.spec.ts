/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { SideDrawerAiReaderComponent } from './side-drawer-ai-reader.component';

describe('SideDrawerAiReaderComponent', () => {
  let component: SideDrawerAiReaderComponent;
  let fixture: ComponentFixture<SideDrawerAiReaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SideDrawerAiReaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SideDrawerAiReaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
