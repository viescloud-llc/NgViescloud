import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnsibleOpenidLoginComponent } from './ensible-openid-login.component';

describe('EnsibleOpenidLogin Component', () => {
  let component: EnsibleOpenidLoginComponent;
  let fixture: ComponentFixture<EnsibleOpenidLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnsibleOpenidLoginComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnsibleOpenidLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
