/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { SpringBootSnippetV01Component } from './Spring-boot-snippet-v01.component';

describe('SpringBootSnippetV01Component', () => {
  let component: SpringBootSnippetV01Component;
  let fixture: ComponentFixture<SpringBootSnippetV01Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpringBootSnippetV01Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpringBootSnippetV01Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
