import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatFormFieldInputUserAccessComponent } from './mat-form-field-input-user-access.component';

describe('MatFormFieldInputUserAccess Component', () => {
  let component: MatFormFieldInputUserAccessComponent;
  let fixture: ComponentFixture<MatFormFieldInputUserAccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MatFormFieldInputUserAccessComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MatFormFieldInputUserAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
