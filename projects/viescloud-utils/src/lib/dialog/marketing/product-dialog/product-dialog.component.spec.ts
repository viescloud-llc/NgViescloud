/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ProductDialog } from './product-dialog.component';

describe('ProductDialogComponent', () => {
  let component: ProductDialog;
  let fixture: ComponentFixture<ProductDialog>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProductDialog ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
