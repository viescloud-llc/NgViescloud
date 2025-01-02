import { TestBed } from '@angular/core/testing';
import { EnsibleDockerContainerTemplateService } from './ensible-docker-container-template.service';

describe('EnsibleDockerContainerTemplate Service', () => {
  let service: EnsibleDockerContainerTemplateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsibleDockerContainerTemplateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
