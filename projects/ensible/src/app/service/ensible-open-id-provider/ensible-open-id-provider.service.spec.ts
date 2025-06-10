import { TestBed } from '@angular/core/testing';
import { EnsibleOpenIdProviderService } from './ensible-open-id-provider.service';

describe('EnsibleOpenIdProvider Service', () => {
  let service: EnsibleOpenIdProviderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsibleOpenIdProviderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
