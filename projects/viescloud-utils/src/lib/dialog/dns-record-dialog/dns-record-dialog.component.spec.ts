/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { DnsRecordDialog } from './dns-record-dialog.component';

describe('DnsRecordDialog', () => {
  let component: DnsRecordDialog;
  let fixture: ComponentFixture<DnsRecordDialog>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DnsRecordDialog ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DnsRecordDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
