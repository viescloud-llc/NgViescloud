import { TestBed } from '@angular/core/testing';
import { EnsibleFsService } from './ensible-fs.service';

describe('ensiblefs Service', () => {
  let service: EnsibleFsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsibleFsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
