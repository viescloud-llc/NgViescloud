/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ProductData } from './product-data.service';

describe('Service: ProductData', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductData]
    });
  });

  it('should ...', inject([ProductData], (service: ProductData) => {
    expect(service).toBeTruthy();
  }));
});
