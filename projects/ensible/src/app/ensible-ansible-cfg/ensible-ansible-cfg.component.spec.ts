import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnsibleAnsibleCfgComponent } from './ensible-ansible-cfg.component';

describe('EnsibleAnsibleCfg Component', () => {
  let component: EnsibleAnsibleCfgComponent;
  let fixture: ComponentFixture<EnsibleAnsibleCfgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnsibleAnsibleCfgComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnsibleAnsibleCfgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
