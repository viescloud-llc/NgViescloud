import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnsibleSettingComponent } from './ensible-setting.component';

describe('ensiblesetting Component', () => {
  let component: EnsibleSettingComponent;
  let fixture: ComponentFixture<EnsibleSettingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnsibleSettingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnsibleSettingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
