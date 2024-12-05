import { TestBed } from '@angular/core/testing';
import { EnsibleService } from './ensible.service';

describe('ensible Service', () => {
  let service: EnsibleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsibleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return data from getData method', () => {
    expect(service.getData()).toBe('Hello from EnsibleService');
  });
});
