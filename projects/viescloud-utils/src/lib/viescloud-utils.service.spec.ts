import { TestBed } from '@angular/core/testing';

import { ViescloudUtilsService } from './viescloud-utils.service';

describe('ViescloudUtilsService', () => {
  let service: ViescloudUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ViescloudUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
