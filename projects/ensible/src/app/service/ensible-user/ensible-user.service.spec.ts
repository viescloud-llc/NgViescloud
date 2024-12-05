import { TestBed } from '@angular/core/testing';
import { EnsibleUserService } from './ensible-user.service';

describe('ensibleuser Service', () => {
  let service: EnsibleUserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsibleUserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
