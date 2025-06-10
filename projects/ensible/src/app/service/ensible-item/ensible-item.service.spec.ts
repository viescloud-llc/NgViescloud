import { TestBed } from '@angular/core/testing';
import { EnsiblePlaybookItemService } from './ensible-item.service';

describe('ensibleitem Service', () => {
  let service: EnsiblePlaybookItemService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsiblePlaybookItemService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
