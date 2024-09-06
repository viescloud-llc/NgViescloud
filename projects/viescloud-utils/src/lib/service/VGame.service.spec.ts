/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { VGameService } from './VGame.service';

describe('Service: VGame', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VGameService]
    });
  });

  it('should ...', inject([VGameService], (service: VGameService) => {
    expect(service).toBeTruthy();
  }));
});
