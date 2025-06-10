import { TestBed } from '@angular/core/testing';
import { EnsibleDatabaseObjectStorageService } from './ensible-database-object-storage.service';

describe('EnsibleDatabaseObjectStorage Service', () => {
  let service: EnsibleDatabaseObjectStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsibleDatabaseObjectStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
