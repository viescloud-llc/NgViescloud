/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ObjectStorageManagerService } from './ObjectStorageManager.service';

describe('Service: ObjectStorageManager', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ObjectStorageManagerService]
    });
  });

  it('should ...', inject([ObjectStorageManagerService], (service: ObjectStorageManagerService) => {
    expect(service).toBeTruthy();
  }));
});
