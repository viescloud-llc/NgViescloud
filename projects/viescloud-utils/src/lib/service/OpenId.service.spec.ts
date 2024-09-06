/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { OpenIdService } from './OpenId.service';

describe('Service: OpenId', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OpenIdService]
    });
  });

  it('should ...', inject([OpenIdService], (service: OpenIdService) => {
    expect(service).toBeTruthy();
  }));
});
