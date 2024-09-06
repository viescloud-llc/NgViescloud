/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { AuthenticatorService } from './Authenticator.service';

describe('Service: Authenticator', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthenticatorService]
    });
  });

  it('should ...', inject([AuthenticatorService], (service: AuthenticatorService) => {
    expect(service).toBeTruthy();
  }));
});
