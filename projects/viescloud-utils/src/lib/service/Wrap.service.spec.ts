/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { WrapService } from './Wrap.service';

describe('Service: Wrap', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [WrapService]
    });
  });

  it('should ...', inject([WrapService], (service: WrapService) => {
    expect(service).toBeTruthy();
  }));
});
