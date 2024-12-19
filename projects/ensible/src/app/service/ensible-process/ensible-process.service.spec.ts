import { TestBed } from '@angular/core/testing';
import { EnsibleProcessService } from './ensible-process.service';

describe('EnsibleProcess Service', () => {
  let service: EnsibleProcessService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsibleProcessService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
