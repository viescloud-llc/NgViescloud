import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnsibleRoleComponent } from './ensible-role.component';

describe('ensiblerole Component', () => {
  let component: EnsibleRoleComponent;
  let fixture: ComponentFixture<EnsibleRoleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnsibleRoleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnsibleRoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
