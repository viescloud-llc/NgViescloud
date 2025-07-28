import { TestBed } from '@angular/core/testing';
import { DockerService } from './docker.service';

describe('Docker Service', () => {
  let service: DockerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DockerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
