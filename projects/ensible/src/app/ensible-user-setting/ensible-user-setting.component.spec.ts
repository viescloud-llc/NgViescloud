import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnsibleUserSettingComponent } from './ensible-user-setting.component';

describe('EnsibleUserSetting Component', () => {
  let component: EnsibleUserSettingComponent;
  let fixture: ComponentFixture<EnsibleUserSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnsibleUserSettingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnsibleUserSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
