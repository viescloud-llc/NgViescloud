/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { MessagePopup } from './message-popup.component';

describe('MessagePopup', () => {
  let component: MessagePopup;
  let fixture: ComponentFixture<MessagePopup>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MessagePopup ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MessagePopup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
