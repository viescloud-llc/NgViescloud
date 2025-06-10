import { TestBed } from '@angular/core/testing';
import { EnsibleSettingService } from './ensible-setting.service';

describe('EnsibleSetting Service', () => {
  let service: EnsibleSettingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnsibleSettingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
