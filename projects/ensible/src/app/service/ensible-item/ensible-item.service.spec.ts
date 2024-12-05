import { TestBed } from '@angular/core/testing';
import { EnsibleItemService } from './ensible-item.service';

describe('ensibleitem Service', () => {
  let service: EnsibleItemService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsibleItemService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
