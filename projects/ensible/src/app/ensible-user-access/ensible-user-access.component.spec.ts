import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnsibleUserAccessComponent } from './ensible-user-access.component';

describe('EnsibleUserAccess Component', () => {
  let component: EnsibleUserAccessComponent;
  let fixture: ComponentFixture<EnsibleUserAccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnsibleUserAccessComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnsibleUserAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
