import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatFormFieldInputRecordComponent } from './mat-form-field-input-record.component';

describe('MatFormFieldInputRecord Component', () => {
  let component: MatFormFieldInputRecordComponent;
  let fixture: ComponentFixture<MatFormFieldInputRecordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MatFormFieldInputRecordComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MatFormFieldInputRecordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
