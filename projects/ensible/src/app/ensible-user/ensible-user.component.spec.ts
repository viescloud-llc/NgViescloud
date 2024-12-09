import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EnsibleUserComponent } from './ensible-user.component';

describe('ensibleuser Component', () => {
  let component: EnsibleUserComponent;
  let fixture: ComponentFixture<EnsibleUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnsibleUserComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EnsibleUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
