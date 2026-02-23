import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatFormFieldFormComponent } from './mat-form-field-form.component';

describe('MatFormFieldForm Component', () => {
  let component: MatFormFieldFormComponent;
  let fixture: ComponentFixture<MatFormFieldFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MatFormFieldFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MatFormFieldFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
