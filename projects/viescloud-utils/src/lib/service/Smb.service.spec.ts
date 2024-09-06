/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { SmbService } from './Smb.service';

describe('Service: Smb', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SmbService]
    });
  });

  it('should ...', inject([SmbService], (service: SmbService) => {
    expect(service).toBeTruthy();
  }));
});
