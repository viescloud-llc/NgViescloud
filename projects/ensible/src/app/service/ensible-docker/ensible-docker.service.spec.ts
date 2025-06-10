import { TestBed } from '@angular/core/testing';
import { EnsibleDockerService } from './ensible-docker.service';

describe('EnsibleDocker Service', () => {
  let service: EnsibleDockerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsibleDockerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
