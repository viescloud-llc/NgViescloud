/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { VenkinsService } from './Venkins.service';

describe('Service: Venkins', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VenkinsService]
    });
  });

  it('should ...', inject([VenkinsService], (service: VenkinsService) => {
    expect(service).toBeTruthy();
  }));
});
