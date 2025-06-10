import { TestBed } from '@angular/core/testing';
import { EnsibleDialogUtilsService } from './ensible-dialog-utils.service';

describe('EnsibleDialogUtils Service', () => {
  let service: EnsibleDialogUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsibleDialogUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
