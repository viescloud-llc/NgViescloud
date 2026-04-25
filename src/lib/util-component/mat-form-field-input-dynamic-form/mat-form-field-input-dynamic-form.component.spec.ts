import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatFormFieldInputDynamicFormComponent } from './mat-form-field-input-dynamic-form.component';

describe('MatFormFieldInputDynamicForm Component', () => {
  let component: MatFormFieldInputDynamicFormComponent;
  let fixture: ComponentFixture<MatFormFieldInputDynamicFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MatFormFieldInputDynamicFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MatFormFieldInputDynamicFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
