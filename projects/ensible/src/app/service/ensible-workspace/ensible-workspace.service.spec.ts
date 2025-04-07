import { TestBed } from '@angular/core/testing';
import { EnsibleAnsibleWorkspaceService } from './ensible-workspace.service';

describe('ensibleworkspace Service', () => {
  let service: EnsibleAnsibleWorkspaceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsibleAnsibleWorkspaceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
