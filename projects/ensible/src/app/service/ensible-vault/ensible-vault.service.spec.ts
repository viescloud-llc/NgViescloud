import { TestBed } from '@angular/core/testing';
import { EnsibleVaultService } from './ensible-vault.service';

describe('ensiblevault Service', () => {
  let service: EnsibleVaultService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsibleVaultService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
