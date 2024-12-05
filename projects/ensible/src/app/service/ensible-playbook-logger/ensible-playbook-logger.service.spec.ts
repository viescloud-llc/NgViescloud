import { TestBed } from '@angular/core/testing';
import { EnsiblePlaybookLoggerService } from './ensible-playbook-logger.service';

describe('ensibleplaybooklogger Service', () => {
  let service: EnsiblePlaybookLoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsiblePlaybookLoggerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
