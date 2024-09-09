/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { AiReaderService } from './ai-reader.service';

describe('Service: AiReaderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AiReaderService]
    });
  });

  it('should ...', inject([AiReaderService], (service: AiReaderService) => {
    expect(service).toBeTruthy();
  }));
});
