/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { OrganizationService } from './Organization.service';

describe('Service: Organization', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OrganizationService]
    });
  });

  it('should ...', inject([OrganizationService], (service: OrganizationService) => {
    expect(service).toBeTruthy();
  }));
});
