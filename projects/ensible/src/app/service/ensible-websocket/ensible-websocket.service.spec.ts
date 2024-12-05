import { TestBed } from '@angular/core/testing';
import { EnsibleWebSocketService } from './ensible-websocket.service';

describe('ensiblewebsocket Service', () => {
  let service: EnsibleWebSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsibleWebSocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
