import { TestBed } from '@angular/core/testing';
import { EnsibleAuthenticatorService } from './ensible-authenticator.service';

describe('ensibleauthenticator Service', () => {
  let service: EnsibleAuthenticatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsibleAuthenticatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
