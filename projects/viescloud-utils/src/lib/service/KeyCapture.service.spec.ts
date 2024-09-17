/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { KeyCaptureService } from './KeyCapture.service';

describe('Service: KeyCapture', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [KeyCaptureService]
    });
  });

  it('should ...', inject([KeyCaptureService], (service: KeyCaptureService) => {
    expect(service).toBeTruthy();
  }));
});
