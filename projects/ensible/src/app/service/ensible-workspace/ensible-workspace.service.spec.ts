import { TestBed } from '@angular/core/testing';
import { AnsibleWorkspaceService } from './ensible-workspace.service';

describe('ensibleworkspace Service', () => {
  let service: AnsibleWorkspaceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnsibleWorkspaceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
