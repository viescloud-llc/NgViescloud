import { TestBed } from '@angular/core/testing';
import { EnsibleWebsocketService } from './ensible-websocket.service';

describe('EnsibleWebsocket Service', () => {
  let service: EnsibleWebsocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsibleWebsocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
