/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { DnsManagerComponent } from './dns-manager.component';

describe('DnsManagerComponent', () => {
  let component: DnsManagerComponent;
  let fixture: ComponentFixture<DnsManagerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DnsManagerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DnsManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
