/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { PinterestService } from './Pinterest.service';

describe('Service: Pinterest', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PinterestService]
    });
  });

  it('should ...', inject([PinterestService], (service: PinterestService) => {
    expect(service).toBeTruthy();
  }));
});
