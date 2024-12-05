import { TestBed } from '@angular/core/testing';
import { EnsibleWorkspaceService } from './ensible-workspace.service';

describe('ensibleworkspace Service', () => {
  let service: EnsibleWorkspaceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsibleWorkspaceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
