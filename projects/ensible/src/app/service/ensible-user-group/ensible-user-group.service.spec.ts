import { TestBed } from '@angular/core/testing';
import { EnsibleUserGroupService } from './ensible-user-group.service';

describe('ensibleusergroup Service', () => {
  let service: EnsibleUserGroupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsibleUserGroupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
